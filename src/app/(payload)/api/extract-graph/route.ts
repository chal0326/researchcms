import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { GraphExtractor } from '@/lib/extractor'

export async function POST(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const body = (await req.json().catch(() => ({}))) as any
    const limit = body.limit || 5
    const cursor = body.cursor || undefined
    const bucketName = body.bucket || 'RESEARCH_DOCS'
    const prefix = body.prefix || 'uploads/'

    const bucket = (env as any)[bucketName] as R2Bucket
    if (!bucket) {
      return NextResponse.json(
        { success: false, error: `Bucket ${bucketName} not found` },
        { status: 400 },
      )
    }

    const extractor = new GraphExtractor(env)
    const list = await bucket.list({ limit, cursor, prefix })

    const totalStats = {
      files: 0,
      chunks: 0,
      entitiesCreated: 0,
      relationshipsCreated: 0,
    }

    for (const obj of list.objects) {
      if (!obj.key.match(/\.(md|txt)$/i)) continue

      const result = await extractor.processFile(bucketName, obj.key)
      if (result.success && result.stats) {
        totalStats.files += result.stats.files
        totalStats.chunks += result.stats.chunks
        totalStats.entitiesCreated += result.stats.entitiesCreated
        totalStats.relationshipsCreated += result.stats.relationshipsCreated
      }
    }

    return NextResponse.json({
      success: true,
      stats: totalStats,
      next_cursor: list.truncated ? list.cursor : null,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
