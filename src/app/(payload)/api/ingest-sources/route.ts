import { NextResponse } from 'next/server'
import { ingestSources } from '../../../../tools/SourceIngestionTool'

export const POST = async (req: Request) => {
  try {
    const body = await req.json()

    // Expect body to be { data: IngestItem[] }
    // or just array IngestItem[]

    const items = Array.isArray(body) ? body : body.data

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected array of items.' },
        { status: 400 },
      )
    }

    const result = await ingestSources(items)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Ingest failed:', error)
    return NextResponse.json({ error: 'Ingest failed', details: error.message }, { status: 500 })
  }
}
