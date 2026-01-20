import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import { GraphExtractor } from '../lib/extractor'

type Env = {
  RESEARCH_DOCS: R2Bucket
  AI: Ai
  D1: D1Database
  EXTRACTION_WORKFLOW: Workflow
}

/**
 * Deduplicates entities in the database by merging duplicates based on the 'name' column.
 * Keeps the entity with the most complete data (EIN, description) and updates all relationships.
 */
async function deduplicateEntities(db: D1Database): Promise<{ merged: number; deleted: number }> {
  try {
    console.log('Starting entity deduplication...')

    // Find all duplicate names within the same source file
    const duplicates = await db
      .prepare(
        `
      SELECT name, source_file, COUNT(*) as count
      FROM entities
      WHERE source_file IS NOT NULL
      GROUP BY name, source_file
      HAVING count > 1
    `,
      )
      .all()

    if (!duplicates.results || duplicates.results.length === 0) {
      console.log('No duplicate entities found.')
      return { merged: 0, deleted: 0 }
    }

    console.log(`Found ${duplicates.results.length} duplicate entity name+source_file combinations`)

    let totalMerged = 0
    let totalDeleted = 0

    for (const dup of duplicates.results as Array<{
      name: string
      source_file: string
      count: number
    }>) {
      const name = dup.name
      const sourceFile = dup.source_file

      // Get all entities with this name AND source_file, ordered by completeness
      const entities = await db
        .prepare(
          `
        SELECT id, name, type, ein, description, source_file, created_at
        FROM entities
        WHERE name = ? AND source_file = ?
        ORDER BY 
          CASE WHEN ein IS NOT NULL THEN 0 ELSE 1 END,
          LENGTH(COALESCE(description, '')) DESC,
          created_at ASC
      `,
        )
        .bind(name, sourceFile)
        .all()

      if (!entities.results || entities.results.length < 2) continue

      const keepEntity = entities.results[0] as {
        id: number
        name: string
        type: string
        ein?: string
        description?: string
        source_file?: string
        created_at: string
      }
      const duplicateEntities = entities.results.slice(1) as (typeof keepEntity)[]

      console.log(
        `Merging ${duplicateEntities.length} duplicates into entity ${keepEntity.id} (${keepEntity.name} from ${sourceFile})`,
      )

      // Update all relationships pointing to duplicates to point to the kept entity
      for (const dupEntity of duplicateEntities) {
        // Update 'from' relationships
        await db
          .prepare(
            `
          UPDATE relationships
          SET from = ?
          WHERE from = ?
        `,
          )
          .bind(keepEntity.id, dupEntity.id)
          .run()

        // Update 'to' relationships
        await db
          .prepare(
            `
          UPDATE relationships
          SET to = ?
          WHERE to = ?
        `,
          )
          .bind(keepEntity.id, dupEntity.id)
          .run()

        // Delete the duplicate entity
        await db
          .prepare(
            `
          DELETE FROM entities
          WHERE id = ?
        `,
          )
          .bind(dupEntity.id)
          .run()

        totalDeleted++
      }

      totalMerged++
    }

    console.log(
      `Deduplication complete: ${totalMerged} entities merged, ${totalDeleted} duplicates deleted`,
    )
    return { merged: totalMerged, deleted: totalDeleted }
  } catch (error) {
    console.error('Error during entity deduplication:', error)
    throw error
  }
}

/**
 * Gets a Set of all file keys that have already been processed (present in source_file column)
 */
async function getProcessedFiles(db: D1Database): Promise<Set<string>> {
  try {
    const result = await db
      .prepare(
        `
      SELECT DISTINCT source_file
      FROM entities
      WHERE source_file IS NOT NULL
    `,
      )
      .all()

    const processedFiles = new Set<string>()
    if (result.results) {
      for (const row of result.results as Array<{ source_file: string }>) {
        if (row.source_file) {
          processedFiles.add(row.source_file)
        }
      }
    }

    console.log(`Found ${processedFiles.size} already-processed files in database`)
    return processedFiles
  } catch (error) {
    console.error('Error fetching processed files:', error)
    return new Set()
  }
}

export class ExtractionWorkflow extends WorkflowEntrypoint<Env, { key: string; bucket: string }> {
  async run(event: WorkflowEvent<{ key: string; bucket: string }>, step: WorkflowStep) {
    const { key, bucket } = event.payload

    const result = await step.do('extract-graph', async () => {
      // ✅ INITIALIZE HERE: Do not initialize at the top of the file
      const extractor = new GraphExtractor(this.env)
      return await extractor.processFile(bucket, key)
    })

    if (!result.success) {
      throw new Error(`Extraction failed for ${key}: ${result.error}`)
    }

    // After successful extraction, deduplicate entities
    await step.do(
      'deduplicate-entities',
      {
        retries: {
          limit: 2,
          delay: '5 seconds',
          backoff: 'linear',
        },
      },
      async () => {
        return await deduplicateEntities(this.env.D1)
      },
    )

    return result
  }
}

const worker = {
  // R2 Event Trigger (If configured via wrangler)
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)

    if (url.pathname === '/trigger' && req.method === 'POST') {
      const body = (await req.json()) as { key: string; bucket?: string }
      const { key, bucket = 'RESEARCH_DOCS' } = body

      // Check if file has already been processed
      const processedFiles = await getProcessedFiles(env.D1)
      if (processedFiles.has(key)) {
        return Response.json({
          success: false,
          message: `File ${key} has already been processed`,
          alreadyProcessed: true,
        })
      }

      const instance = await env.EXTRACTION_WORKFLOW.create({
        id: `extract-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        params: { key, bucket },
      })
      return Response.json({ success: true, workflowId: instance.id })
    }

    if (url.pathname === '/poll') {
      const { found, triggered } = await worker.scheduled(
        {} as ScheduledEvent,
        env,
        {} as ExecutionContext,
      )
      return new Response(
        JSON.stringify({ message: 'Triggered Poll', found, triggered }, null, 2),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response('Inquisitor Active', { status: 200 })
  },

  // Scheduled Trigger for Polling
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const bucket = env.RESEARCH_DOCS
    let truncated = true
    let cursor: string | undefined = undefined
    let triggered = 0
    let skipped = 0
    let totalFound = 0

    console.log('Starting full bucket scan for "uploads/"...')

    // Get list of already-processed files
    const processedFiles = await getProcessedFiles(env.D1)
    console.log(`Skipping ${processedFiles.size} already-processed files`)

    while (truncated) {
      const list: R2Objects = await bucket.list({
        prefix: 'uploads/',
        cursor,
        limit: 100,
      })

      for (const obj of list.objects) {
        totalFound++
        if (obj.key.match(/\.(md|txt)$/i)) {
          // Skip if already processed
          if (processedFiles.has(obj.key)) {
            skipped++
            continue
          }

          // Use a key-based ID (no timestamp) for true deduplication
          await env.EXTRACTION_WORKFLOW.create({
            id: `poll-${obj.key.replace(/[^a-zA-Z0-9]/g, '-')}`,
            params: { key: obj.key, bucket: 'RESEARCH_DOCS' },
          }).catch((e) => {
            if (e.message.includes('already exists')) {
              // Workflow already running, that's fine
            } else {
              console.error(`Workflow creation failed for ${obj.key}`, e)
            }
          })
          triggered++
        }
      }

      truncated = list.truncated
      cursor = list.truncated ? list.cursor : undefined
      console.log(`Scan progress: Found ${totalFound} files so far...`)
    }

    console.log(
      `Full scan complete. Found ${totalFound} total objects, skipped ${skipped} already processed, triggered ${triggered} new extractions.`,
    )
    return { found: totalFound, triggered, skipped }
  },

  // Queue Handler
  async queue(
    batch: MessageBatch<{
      key?: string
      object?: { key?: string }
      bucket?: string
      bucketName?: string
    }>,
    env: Env,
  ) {
    // Get list of already-processed files once for the batch
    const processedFiles = await getProcessedFiles(env.D1)

    for (const message of batch.messages) {
      const body = message.body
      // Handle R2 Event Notification format
      const key = body.object?.key || body.key
      const bucketName = body.bucket || body.bucketName || 'RESEARCH_DOCS'

      if (key && key.match(/\.(md|txt)$/i)) {
        // Skip if already processed
        if (processedFiles.has(key)) {
          console.log(`Skipping already-processed file: ${key}`)
          message.ack()
          continue
        }

        await env.EXTRACTION_WORKFLOW.create({
          id: `queue-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
          params: { key, bucket: bucketName },
        }).catch((e) => console.error(`Queue workflow creation failed for ${key}`, e))
      }
      message.ack()
    }
  },
}

export default worker
