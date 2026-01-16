import { Payload, getPayload } from 'payload'

export interface ExtractionStats {
  files: number
  chunks: number
  entitiesCreated: number
  relationshipsCreated: number
}

export interface ExtractionResult {
  success: boolean
  stats?: ExtractionStats
  error?: string
}

const VALID_ENTITY_TYPES = [
  'Person',
  'Organization',
  'Event',
  'Actor',
  'Polity',
  'Concept',
  'Location',
  'Impact',
  'Topic',
  'System',
  'Other',
]

const VALID_REL_TYPES = [
  'TRIGGERED',
  'PARTICIPATED_IN',
  'AFFECTED',
  'LOCATED_IN',
  'PRECEDES',
  'FOLLOWS',
  'ASSOCIATED_WITH',
  'MENTIONS',
]

export class GraphExtractor {
  private payload?: Payload

  constructor(private env: any) {}

  private async getPayloadInstance() {
    if (!this.payload) {
      ;(globalThis as any).__CLOUDFLARE_ENV__ = this.env
      const { default: config } = await import('../payload.config')
      this.payload = await getPayload({ config })
    }
    return this.payload
  }

  async processFile(bucketName: string, key: string): Promise<ExtractionResult> {
    try {
      const bucket = this.env[bucketName] as R2Bucket
      if (!bucket) throw new Error(`Bucket ${bucketName} not found`)

      const item = await bucket.get(key)
      if (!item) throw new Error(`File ${key} not found`)

      const text = await item.text()
      const ai = this.env.AI as any
      const payload = await this.getPayloadInstance()

      // Chunking logic
      const chunks = text
        .split(/(?=\n#{1,3}\s)/)
        .flatMap((c) => (c.length > 8000 ? c.match(/[\s\S]{1,8000}/g) || [c] : [c]))
        .filter((c) => c.trim().length > 100)

      const extractionResults = await Promise.all(
        chunks.map((chunk) =>
          this.processChunk(ai, chunk).catch(() => ({ entities: [], relationships: [] })),
        ),
      )

      const fileEntities = new Map<string, any>()
      const fileRels: any[] = []
      const allNames = new Set<string>()

      for (const res of extractionResults) {
        for (const ent of res.entities || []) {
          const name = (ent.name || '').trim()
          if (!name) continue
          allNames.add(name)
          if (
            !fileEntities.has(name) ||
            ent.ein ||
            (ent.description?.length || 0) > (fileEntities.get(name)?.description?.length || 0)
          ) {
            fileEntities.set(name, ent)
          }
        }
        for (const rel of res.relationships || []) {
          const from = (rel.from || rel.from_name || '').trim()
          const to = (rel.to || rel.to_name || '').trim()
          if (from && to) {
            allNames.add(from)
            allNames.add(to)
            fileRels.push({ ...rel, from, to })
          }
        }
      }

      const allNamesArr = Array.from(allNames)
      const allEinsArr = Array.from(fileEntities.values())
        .map((e) => e.ein)
        .filter(Boolean) as string[]

      const existingDocs = await payload.find({
        collection: 'entities',
        where: {
          or: [{ name: { in: allNamesArr } }, { ein: { in: allEinsArr } }],
        },
        limit: 500,
      })

      const entityMap = new Map<string, string>()
      const einMap = new Map<string, string>()

      for (const doc of existingDocs.docs) {
        entityMap.set(doc.name, doc.id)
        if (doc.ein) einMap.set(doc.ein, doc.id)
      }

      let entitiesCreated = 0
      let relsCreated = 0

      // Sync Entities
      const upsertOps = Array.from(fileEntities.entries()).map(async ([name, ent]) => {
        try {
          const existingId = (ent.ein && einMap.get(ent.ein)) || entityMap.get(name)
          if (existingId) {
            entityMap.set(name, existingId)
            if (ent.ein && !einMap.has(ent.ein)) {
              await payload.update({
                collection: 'entities',
                id: existingId,
                data: { ein: ent.ein },
              })
            }
          } else {
            const created = await payload.create({
              collection: 'entities',
              data: {
                name,
                type: VALID_ENTITY_TYPES.includes(ent.type) ? ent.type : 'Other',
                ein: ent.ein,
                description: ent.description,
                aliases: (ent.aliases || []).map((a: any) => ({ name: a.name, type: a.type })),
                source_file: key,
              },
            })
            entityMap.set(name, created.id)
            entitiesCreated++
          }
        } catch (e) {
          console.error(`Error syncing entity ${name}:`, e)
        }
      })
      await Promise.all(upsertOps)

      // Sync Relationships
      const relOps = fileRels.map(async (rel) => {
        try {
          const fromId = entityMap.get(rel.from)
          const toId = entityMap.get(rel.to)
          if (fromId && toId) {
            await payload.create({
              collection: 'relationships',
              data: {
                from: fromId,
                to: toId,
                type: VALID_REL_TYPES.includes(rel.type) ? rel.type : 'ASSOCIATED_WITH',
                description: rel.description,
                source_file: key,
              },
            })
            relsCreated++
          }
        } catch (e) {
          console.error('Error syncing relationship:', e)
        }
      })
      await Promise.all(relOps)

      return {
        success: true,
        stats: {
          files: 1,
          chunks: chunks.length,
          entitiesCreated,
          relationshipsCreated: relsCreated,
        },
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private async processChunk(ai: any, chunk: string) {
    const prompt = `Extract entities and relationships from the following investigative notes.
    Entity Types: ${VALID_ENTITY_TYPES.join(', ')}
    Rel Types: ${VALID_REL_TYPES.join(', ')}
    Return JSON ONLY:
    {
      "entities": [{ "name": "...", "type": "valid type", "ein": "...", "description": "...", "aliases": [{ "name": "...", "type": "AKA|DBA" }] }],
      "relationships": [{ "from": "...", "to": "...", "type": "valid type", "description": "..." }]
    }
    Text: ${chunk}`

    const response = await ai.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: 'You are an investigative assistant. Return JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.response || response.result?.response || ''
    let jsonString = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    if (!jsonString.endsWith('}')) {
      const lastBrace = jsonString.lastIndexOf('}')
      if (lastBrace !== -1) jsonString = jsonString.substring(0, lastBrace + 1)
    }
    return JSON.parse(jsonString)
  }
}
