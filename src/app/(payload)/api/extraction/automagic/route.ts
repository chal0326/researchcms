import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const bucket = (env as any).RESEARCH_DOCS as R2Bucket
    const queue = (env as any).EXTRACTION_QUEUE as Queue

    if (!bucket || !queue) {
      return NextResponse.json(
        { success: false, error: 'R2 or Queue binding missing' },
        { status: 500 },
      )
    }

    const list = await bucket.list({ prefix: 'uploads/' })
    let enqueued = 0

    for (const obj of list.objects) {
      if (obj.key.match(/\.(md|txt)$/i)) {
        await queue.send({ key: obj.key, bucket: 'RESEARCH_DOCS' })
        enqueued++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enqueued ${enqueued} files for background extraction.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
