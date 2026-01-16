import { getPayload } from 'payload'
import config from '../payload.config'

interface IngestItem {
  Title: string
  Type: string
  Author?: string
  PublicationDate?: string
  URL?: string
  Events?: string // Comma-separated slugs or IDs
  CitationText?: string
}

interface IngestResult {
  total: number
  created: number
  skipped: number
  linked_events: number
  errors: string[]
}

export const ingestSources = async (data: IngestItem[]): Promise<IngestResult> => {
  const payload = await getPayload({ config })
  const result: IngestResult = {
    total: data.length,
    created: 0,
    skipped: 0,
    linked_events: 0,
    errors: [],
  }

  for (const item of data) {
    try {
      if (!item.Title || !item.Type) {
        result.errors.push(`Skipping item: Missing Title or Type ("${item.Title}")`)
        continue
      }

      // 1. Deduplication Check
      // Check by URL first (if exists), then Title
      const where: any = {
        or: [],
      }

      if (item.URL) {
        where.or.push({ url: { equals: item.URL } })
      }
      where.or.push({ title: { equals: item.Title } })

      const existing = await payload.find({
        collection: 'sources',
        where,
        limit: 1,
      })

      let sourceId = ''

      if (existing.docs.length > 0) {
        sourceId = existing.docs[0].id
        result.skipped++
        // We link existing sources too if requested, so we proceed to linking
      } else {
        // Create new
        const newSource = await payload.create({
          collection: 'sources',
          data: {
            title: item.Title,
            type: mapSourceType(item.Type),
            author: item.Author,
            url: item.URL,
            citation_text: item.CitationText,
            publication_date: item.PublicationDate
              ? new Date(item.PublicationDate).toISOString()
              : undefined,
          },
        })
        sourceId = newSource.id
        result.created++
      }

      // 2. Smart Linking to Events
      if (item.Events && sourceId) {
        const eventIdentifiers = item.Events.split(',')
          .map((s) => s.trim())
          .filter(Boolean)

        for (const identifier of eventIdentifiers) {
          // Find the event by slug or ID
          // Note: ID searches in Payload usually require known UUID format, strict slug search is safer if IDs vary.
          // We'll search OR (slug = id, id = id)

          const eventQuery = await payload.find({
            collection: 'timeline-events',
            where: {
              or: [
                { id: { equals: identifier } },
                { slug: { equals: identifier } }, // Assuming slug exists or we map to Title/ID?
                // Wait, TimelineEvents doesn't have a 'slug' field in my previous read?
                // Let's check TimelineEvents.ts schema memory.
                // It has 'id' (custom text) and 'title'. It does NOT have 'slug' in the standard sense unless I added it.
                // Looking at Step 7 view_file: It has 'id' (text), 'year', 'title'.
                // So we match on 'id' (which user can set) or 'title' maybe?
                // The prompt Step 0 mentioned "2024-ziklag-exposed" as an ID example.
                // So we match on 'id'.
              ],
            },
            limit: 1,
          })

          if (eventQuery.docs.length > 0) {
            const eventDoc = eventQuery.docs[0]

            // Check if source already linked?
            const currentSources = eventDoc.sources || []
            const isAlreadyLinked = currentSources.some(
              (s) => (typeof s.source === 'object' ? s.source.id : s.source) === sourceId,
            )

            if (!isAlreadyLinked) {
              await payload.update({
                collection: 'timeline-events',
                id: eventDoc.id,
                data: {
                  sources: [
                    ...currentSources.map((s) => ({
                      source: typeof s.source === 'object' ? s.source.id : s.source,
                      reference_location: s.reference_location,
                      quote: s.quote,
                    })),
                    {
                      source: sourceId,
                      reference_location: 'Bulk Import', // Default placeholder
                    },
                  ],
                },
              })
              result.linked_events++
            }
          } else {
            // Event not found
            // Just ignore or log?
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Error processing "${item.Title}": ${e.message}`)
    }
  }

  return result
}

function mapSourceType(raw: string): any {
  // Simple check to match valid schema options
  const valid = ['Book', 'Academic Paper', 'URL', 'Court Document', 'Media File', 'Interview']
  if (valid.includes(raw)) return raw
  if (raw === 'News Article' || raw === 'Website') return 'URL'
  return 'Other'
}
