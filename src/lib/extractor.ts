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

      // Chunking logic - split by headers but keep chunks manageable
      const chunks = text
        .split(/(?=\n#{1,3}\s)/)
        .flatMap((c) => (c.length > 6000 ? c.match(/[\s\S]{1,6000}/g) || [c] : [c]))
        .filter((c) => c.trim().length > 50)

      console.log(`Processing file: ${key} (${chunks.length} chunks)`)

      const extractionResults: any[] = []
      for (let i = 0; i < chunks.length; i++) {
        try {
          // Add a small delay to avoid rate limiting
          if (i > 0) await new Promise((res) => setTimeout(res, 1000))

          console.log(`Processing chunk ${i + 1}/${chunks.length} of ${key}...`)
          const res = await this.processChunk(ai, chunks[i])
          extractionResults.push(res)
          console.log(
            `Chunk ${i + 1} result: ${res.entities?.length || 0} entities, ${res.relationships?.length || 0} relationships, ${res.events?.length || 0} events.`,
          )
        } catch (err) {
          console.error(`Error processing chunk ${i} of ${key}:`, err)
        }
      }

      const fileEntities = new Map<string, any>()
      const fileRels: any[] = []
      const fileEvents: any[] = []
      const allNames = new Set<string>()

      for (const res of extractionResults) {
        const ents = res.entities || []
        const rels = res.relationships || []
        const events = res.events || []

        for (const ent of ents) {
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
        for (const rel of rels) {
          const from = (rel.from || '').trim()
          const to = (rel.to || '').trim()
          if (from && to) {
            allNames.add(from)
            allNames.add(to)
            fileRels.push({ ...rel, from, to })
          }
        }
        for (const evt of events) {
          fileEvents.push(evt)
          if (evt.participants) {
            evt.participants.forEach((p: string) => allNames.add(p.trim()))
          }
        }
      }

      console.log(
        `Aggregated ${fileEntities.size} unique entities, ${fileRels.length} relationships, and ${fileEvents.length} events from ${key}`,
      )

      const allNamesArr = Array.from(allNames)
      const allEinsArr = Array.from(fileEntities.values())
        .map((e) => e.ein)
        .filter(Boolean) as string[]

      if (allNamesArr.length === 0 && fileEvents.length === 0) {
        console.log(`No data found in ${key}, skipping sync.`)
        return {
          success: true,
          stats: { files: 1, chunks: chunks.length, entitiesCreated: 0, relationshipsCreated: 0 },
        }
      }

      // 1. Fetch Existing Entities to avoid duplicates
      const existingDocs = await payload.find({
        collection: 'entities',
        where: {
          or: [{ name: { in: allNamesArr } }, { ein: { in: allEinsArr } }],
        },
        limit: 1000,
      })

      const entityMap = new Map<string, string>()
      const einMap = new Map<string, string>()

      for (const doc of existingDocs.docs) {
        entityMap.set(doc.name, doc.id)
        if (doc.ein) einMap.set(doc.ein, doc.id)
      }

      let entitiesCreatedCount = 0
      let relsCreatedCount = 0

      // 2. Sync Entities
      for (const [name, ent] of fileEntities.entries()) {
        try {
          const existingId = (ent.ein && einMap.get(ent.ein)) || entityMap.get(name)
          if (existingId) {
            entityMap.set(name, existingId)
            // Update EIN if missing
            if (ent.ein && !einMap.has(ent.ein)) {
              await payload.update({
                collection: 'entities',
                id: existingId,
                data: { ein: ent.ein },
              })
              einMap.set(ent.ein, existingId)
            }
          } else {
            console.log(`Creating entity: ${name}`)
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
            if (ent.ein) einMap.set(ent.ein, created.id)
            entitiesCreatedCount++
          }
        } catch (e) {
          console.error(`Error syncing entity ${name}:`, e)
        }
      }

      // 3. Sync Relationships
      for (const rel of fileRels) {
        try {
          const fromId = entityMap.get(rel.from)
          const toId = entityMap.get(rel.to)
          if (fromId && toId) {
            const relType = VALID_REL_TYPES.includes(rel.type) ? rel.type : 'ASSOCIATED_WITH'
            const existingRel = await payload.find({
              collection: 'relationships',
              where: {
                and: [
                  { from: { equals: fromId } },
                  { to: { equals: toId } },
                  { type: { equals: relType } },
                ],
              },
              limit: 1,
            })

            if (existingRel.docs.length === 0) {
              console.log(`Creating relationship: ${rel.from} -> ${rel.to} (${relType})`)
              await payload.create({
                collection: 'relationships',
                data: {
                  from: fromId,
                  to: toId,
                  type: relType,
                  description: rel.description,
                  source_file: key,
                },
              })
              relsCreatedCount++
            }
          }
        } catch (e) {
          console.error('Error syncing relationship:', e)
        }
      }

      // 4. Sync TimelineEvents
      const mountains = await payload.find({ collection: 'mountains', limit: 100 })
      const mtnMap = new Map(mountains.docs.map((m) => [m.title.toLowerCase(), m.id]))

      for (const evt of fileEvents) {
        try {
          if (!evt.year || !evt.title) continue

          const involvedEntities = (evt.participants || [])
            .map((p: string) => ({
              entity: entityMap.get(p.trim()),
              context: `Mentioned in event: ${evt.title}`,
            }))
            .filter((p: any) => p.entity)

          const mountainIds = (evt.mountains || [])
            .map((m: string) => mtnMap.get(m.toLowerCase()))
            .filter(Boolean)

          // Try to find if this event might already exist (same year, same title)
          const existingEvt = await payload.find({
            collection: 'timeline-events',
            where: {
              and: [{ year: { equals: parseInt(evt.year) } }, { title: { equals: evt.title } }],
            },
            limit: 1,
          })

          if (existingEvt.docs.length === 0) {
            console.log(`Creating Timeline Event: ${evt.title} (${evt.year})`)
            await payload.create({
              collection: 'timeline-events',
              data: {
                year: parseInt(evt.year),
                month: evt.month?.toString(),
                day: evt.day ? parseInt(evt.day) : undefined,
                title: evt.title,
                body: {
                  root: {
                    type: 'root',
                    children: [
                      {
                        type: 'paragraph',
                        children: [{ type: 'text', text: evt.description || evt.body || '' }],
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                },
                mountains: mountainIds.length > 0 ? mountainIds : [mtnMap.get('religion')!], // Default to Religion if unknown
                entities: involvedEntities,
                original_text: JSON.stringify(evt),
              },
            })
          }
        } catch (e) {
          console.error('Error syncing timeline event:', e)
        }
      }

      console.log(
        `File ${key} complete. Created ${entitiesCreatedCount} entities, ${relsCreatedCount} relationships.`,
      )

      return {
        success: true,
        stats: {
          files: 1,
          chunks: chunks.length,
          entitiesCreated: entitiesCreatedCount,
          relationshipsCreated: relsCreatedCount,
        },
      }
    } catch (error: any) {
      console.error(`Fatal error processing file ${key}:`, error)
      return { success: false, error: error.message }
    }
  }

  private async processChunk(ai: any, chunk: string) {
    const prompt = `Extract entities, relationships, and CHRONOLOGICAL events from these investigative notes.
    
    Entity Types: ${VALID_ENTITY_TYPES.join(', ')}
    Relationship Types: ${VALID_REL_TYPES.join(', ')}
    Mountains of Culture: Government, Business and Economics, Religion, Media, Family, Education, Arts and Entertainment
    
    Rules:
    1. EIN MUST be exactly 9 numeric digits. No dashes. Omit if unsure.
    2. Events MUST have at least a year.
    3. Return valid JSON only.

    {
      "entities": [
        { "name": "...", "type": "...", "ein": "000000000", "description": "...", "aliases": [] }
      ],
      "relationships": [
        { "from": "...", "to": "...", "type": "...", "description": "..." }
      ],
      "events": [
        { "year": 2024, "month": 1, "day": 15, "title": "...", "description": "...", "participants": ["EntityName1", "EntityName2"], "mountains": ["Religion", "Media"] }
      ]
    }
    
    Text: ${chunk}`

    const response = await ai.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are an investigative knowledge graph extractor. Return JSON ONLY.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.response || response.result?.response || ''
    let jsonString = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // Attempt fix for common AI JSON truncations
    if (!jsonString.endsWith('}')) {
      const lastBrace = jsonString.lastIndexOf('}')
      if (lastBrace !== -1) jsonString = jsonString.substring(0, lastBrace + 1)
    }

    const result = JSON.parse(jsonString)

    // Sanitize EINs
    if (result.entities) {
      result.entities = result.entities.map((ent: any) => {
        if (ent.ein) {
          const cleaned = ent.ein.replace(/\D/g, '')
          if (cleaned.length === 9) ent.ein = cleaned
          else delete ent.ein
        }
        return ent
      })
    }

    return result
  }
}
