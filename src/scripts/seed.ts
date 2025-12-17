/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'
import config from '../payload.config'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function convertToLexical(slateNodes: any) {
  if (!slateNodes || !Array.isArray(slateNodes))
    return {
      root: {
        type: 'root',
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }

  const lexicalChildren = slateNodes.map((node: any) => {
    if (node.type === 'p' || !node.type) {
      return {
        type: 'paragraph',
        children: (node.children || []).map((child: any) => {
          if (child.text !== undefined) {
            return {
              type: 'text',
              text: child.text,
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              version: 1,
            }
          }
          return child
        }),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
      }
    }
    // Handle other types if necessary, default to paragraph for simplicity in this seed
    return {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: JSON.stringify(node), // Fallback
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      textFormat: 0,
    }
  })

  return {
    root: {
      type: 'root',
      children: lexicalChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

async function seed() {
  const payload = await getPayload({ config })

  const seedFilePath = path.resolve(dirname, '../../payload_seed.json')
  const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'))

  console.log('Seeding Mountains...')
  const mountainMap = new Map()
  for (const mountain of seedData.mountains) {
    const data = { ...mountain }
    if (data.summary) {
      data.summary = convertToLexical(data.summary)
    }

    // Check if exists
    const existing = await payload.find({
      collection: 'mountains',
      where: { slug: { equals: mountain.slug } },
      limit: 1,
    })

    let result
    if (existing.docs.length > 0) {
      result = await payload.update({
        collection: 'mountains',
        id: existing.docs[0].id,
        data,
      })
    } else {
      result = await payload.create({
        collection: 'mountains',
        data,
      })
    }
    mountainMap.set(mountain.slug, result.id)
  }
  console.log(`Created ${mountainMap.size} mountains.`)

  console.log('Seeding Entities...')
  const entityMap = new Map()
  for (const entity of seedData.entities) {
    // Check if exists
    const existing = await payload.find({
      collection: 'entities',
      where: { name: { equals: entity.name } },
      limit: 1,
    })

    let result
    if (existing.docs.length > 0) {
      result = await payload.update({
        collection: 'entities',
        id: existing.docs[0].id,
        data: entity,
      })
    } else {
      result = await payload.create({
        collection: 'entities',
        data: entity,
      })
    }
    entityMap.set(entity.name, result.id)
  }
  console.log(`Created ${entityMap.size} entities.`)

  console.log('Seeding Timeline Events...')
  let eventCount = 0
  for (const event of seedData.events) {
    // Map mountain slug to ID
    const mountainId = mountainMap.get(event.mountain)
    if (!mountainId) {
      console.warn(`Mountain not found for event: ${event.title} (slug: ${event.mountain})`)
      continue
    }

    // Map entity names to IDs
    const entityIds = []
    if (event.entities && Array.isArray(event.entities)) {
      for (const entityName of event.entities) {
        const entityId = entityMap.get(entityName)
        if (entityId) {
          entityIds.push(entityId)
        } else {
          // It's possible some entities in events are not in the entities list?
          // We'll skip them or warn.
          // console.warn(`Entity not found: ${entityName} in event ${event.title}`)
        }
      }
    }

    const eventData = {
      ...event,
      id: event.id || crypto.randomUUID(),
      mountain: mountainId,
      entities: entityIds,
    }
    if (eventData.body) {
      eventData.body = convertToLexical(eventData.body)
    }

    // Check existing by ID if possible, or title + year?
    // Schema has 'id' field which might be in json?
    // JSON has "id"? No.
    // Let's rely on create. If we want upsert, we need a unique key.
    // Title might be unique?
    // Just create for now, or check title.
    const existing = await payload.find({
      collection: 'timeline-events',
      where: { title: { equals: event.title } }, // approximate unique
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'timeline-events',
        id: existing.docs[0].id,
        data: eventData,
      })
    } else {
      await payload.create({
        collection: 'timeline-events',
        data: eventData,
      })
    }
    eventCount++
  }
  console.log(`Created ${eventCount} timeline events.`)

  console.log('Seeding Narrative Config...')
  if (seedData.globals) {
    const globalData: Record<string, any> = {}
    if (seedData.globals.prologue) globalData.prologue = convertToLexical(seedData.globals.prologue)
    if (seedData.globals.epilogue) globalData.epilogue = convertToLexical(seedData.globals.epilogue)
    if (seedData.globals.authors) globalData.authors = seedData.globals.authors
    if (seedData.globals.version) globalData.version = seedData.globals.version

    // Check if narrative-config allows updates or needs initialization
    await payload.updateGlobal({
      slug: 'narrative-config',
      data: globalData,
    })
    console.log('Narrative Config updated.')
  }

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
