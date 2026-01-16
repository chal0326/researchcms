import { getPayload } from 'payload'
import config from '../payload.config'

// Use the global CloudflareEnv interface
// If not available globally, we can define a partial interface of what we need
interface Env extends CloudflareEnv {}

interface LedgerContract {
  id: string
  contractor_name: string
  service_desc: string
  amount: number
  year: number
  payer_entity_id: string
  payee_entity_id: string
}

interface LedgerPerson {
  id: string
  name: string
  role: string
  compensation: number
  year: number
  ein: string
}

interface LedgerEntity {
  id: string
  name: string
  ein: string
  type: string
}

interface LedgerEdge {
  id: string
  source_id: string
  target_id: string
  type: string
  role: string
  year: number
  amount: number
  attributes: string
}

export const syncLedgerToPayload = async (env: Env) => {
  const payload = await getPayload({ config })

  if (!env.LEDGER) {
    throw new Error('LEDGER binding missing')
  }

  // 1. Sync Entities from 990-ledger.entities
  const { results: entities } = await env.LEDGER.prepare(
    // Fetch recent or all entities. Using LIMIT for safety in this tool iteration.
    'SELECT * FROM entities LIMIT 2000',
  ).all<LedgerEntity>()

  const entityMap = new Map<string, string>() // Map ledger_id -> payload_id

  for (const ent of entities) {
    // Check if exists using the new index
    const existing = await payload.find({
      collection: 'entities',
      where: {
        ledger_source_id: { equals: ent.id },
      },
      limit: 1,
    })

    let payloadId = ''

    if (existing.docs.length > 0) {
      payloadId = existing.docs[0].id
      // Optional: Update fields if needed?
    } else {
      try {
        const newEnt = await payload.create({
          collection: 'entities',
          data: {
            name: ent.name || 'Unknown Entity',
            type: (ent.type as any) || 'Organization',
            ein: ent.ein,
            ledger_source_id: ent.id,
          },
        })
        payloadId = newEnt.id
      } catch (e) {
        console.error(`Failed to create entity ${ent.name}:`, e)
        continue
      }
    }
    entityMap.set(ent.id, payloadId)
  }

  // 2. Sync Edges
  const { results: edges } = await env.LEDGER.prepare(
    'SELECT * FROM edges LIMIT 2000',
  ).all<LedgerEdge>()

  let edgesSynced = 0
  for (const edge of edges) {
    const fromId = entityMap.get(edge.source_id)
    const toId = entityMap.get(edge.target_id)

    if (!fromId || !toId) {
      // If we don't have both ends, we can't create the relationship
      continue
    }

    const edgeData = {
      from: fromId,
      to: toId,
      type: mapEdgeType(edge.type),
      amount: edge.amount,
      year: edge.year,
      role: edge.role,
      ledger_source_id: edge.id,
      description: edge.attributes,
    }

    const existingEdge = await payload.find({
      collection: 'relationships',
      where: {
        ledger_source_id: { equals: edge.id },
      },
      limit: 1,
    })

    try {
      if (existingEdge.docs.length > 0) {
        await payload.update({
          collection: 'relationships',
          id: existingEdge.docs[0].id,
          data: edgeData,
        })
      } else {
        await payload.create({
          collection: 'relationships',
          data: edgeData,
        })
      }
      edgesSynced++
    } catch (e) {
      console.error(`Failed to sync edge ${edge.id}:`, e)
    }
  }

  return { success: true, entities: entities.length, edges_synced: edgesSynced }
}

function mapEdgeType(rawType: string): 'Contract' | 'Grant' | 'Employment' | 'Board' | 'Other' {
  if (!rawType) return 'Other'
  const norm = rawType.toLowerCase()
  if (norm.includes('contract')) return 'Contract'
  if (norm.includes('grant')) return 'Grant'
  if (norm.includes('employee') || norm.includes('comp') || norm.includes('salary'))
    return 'Employment'
  if (norm.includes('board') || norm.includes('officer') || norm.includes('trustee')) return 'Board'
  return 'Other'
}
