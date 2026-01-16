import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import { GraphExtractor } from '../lib/extractor'

type Env = {
  RESEARCH_DOCS: R2Bucket
  AI: AI
  D1: D1Database
  EXTRACTION_WORKFLOW: Workflow
}

export class ExtractionWorkflow extends WorkflowEntrypoint<Env, { key: string; bucket: string }> {
  async run(event: WorkflowEvent<{ key: string; bucket: string }>, step: WorkflowStep) {
    const { key, bucket } = event.payload

    const result = await step.do(
      'extract-graph',
      {
        retries: {
          limit: 3,
          delay: '10 seconds',
          backoff: 'exponential',
        },
      },
      async () => {
        const extractor = new GraphExtractor(this.env)
        return await extractor.processFile(bucket, key)
      },
    )

    if (!result.success) {
      throw new Error(`Extraction failed for ${key}: ${result.error}`)
    }

    return result
  }
}

const worker = {
  // R2 Event Trigger (If configured via wrangler)
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)

    if (url.pathname === '/trigger' && req.method === 'POST') {
      const { key, bucket = 'RESEARCH_DOCS' } = (await req.json()) as any
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
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const bucket = env.RESEARCH_DOCS
    let truncated = true
    let cursor: string | undefined = undefined
    let triggered = 0
    let totalFound = 0

    console.log('Starting full bucket scan for "uploads/"...')

    while (truncated) {
      const list: R2Objects = await bucket.list({
        prefix: 'uploads/',
        cursor,
        limit: 100,
      })

      for (const obj of list.objects) {
        totalFound++
        if (obj.key.match(/\.(md|txt)$/i)) {
          // Use a key-based ID + hour stamp to allow fresh processing if desired
          const hourStamp = Math.floor(Date.now() / (3600 * 1000))
          await env.EXTRACTION_WORKFLOW.create({
            id: `poll-${obj.key.replace(/[^a-zA-Z0-9]/g, '-')}-${hourStamp}`,
            params: { key: obj.key, bucket: 'RESEARCH_DOCS' },
          }).catch((e) => {
            if (e.message.includes('already exists')) {
              // Duplicate within the hour, that's fine
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
      `Full scan complete. Found ${totalFound} total objects, triggered ${triggered} potential extractions.`,
    )
    return { found: totalFound, triggered }
  },

  // Queue Handler
  async queue(batch: MessageBatch<any>, env: Env) {
    for (const message of batch.messages) {
      const body = message.body
      // Handle R2 Event Notification format
      const key = body.object?.key || body.key
      const bucketName = body.bucket || body.bucketName || 'RESEARCH_DOCS'

      if (key && key.match(/\.(md|txt)$/i)) {
        await env.EXTRACTION_WORKFLOW.create({
          id: `queue-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
          params: { key, bucket: bucketName },
        }).catch((e) => console.error(`Queue workflow creation failed for ${key}`, e))
      }
      message.ack()
    }
  },
}

export default worker
