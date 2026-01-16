import {
  WorkerEntrypoint,
  WorkflowEntrypoint,
  WorkflowStep,
  WorkflowEvent,
} from 'cloudflare:workers'
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

export default {
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
    return new Response('Inquisitor Active', { status: 200 })
  },

  // Scheduled Trigger for Polling
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const bucket = env.RESEARCH_DOCS
    const list = await bucket.list({ prefix: 'uploads/', limit: 20 })

    // In a real app, you'd check D1/KV to see if these are already processed
    // For now, we'll just trigger the workflow for them
    for (const obj of list.objects) {
      if (obj.key.match(/\.(md|txt)$/i)) {
        await env.EXTRACTION_WORKFLOW.create({
          id: `poll-${obj.key.replace(/[^a-zA-Z0-9]/g, '-')}`,
          params: { key: obj.key, bucket: 'RESEARCH_DOCS' },
        }).catch(() => {}) // Ignore duplicates
      }
    }
  },

  // Queue Handler (Alternative to Workflow for simpler tasks)
  async queue(batch: MessageBatch<{ key: string; bucket: string }>, env: Env) {
    for (const message of batch.messages) {
      await env.EXTRACTION_WORKFLOW.create({
        id: `queue-${message.body.key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        params: message.body,
      })
      message.ack()
    }
  },
}
