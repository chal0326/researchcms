import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const entities = await payload.find({
      collection: 'entities',
      limit: 0,
    })

    const relationships = await payload.find({
      collection: 'relationships',
      limit: 0,
    })

    return NextResponse.json({
      entities: entities.totalDocs,
      relationships: relationships.totalDocs,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
