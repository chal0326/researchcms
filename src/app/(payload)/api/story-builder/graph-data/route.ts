import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Entity, Relationship } from '@/payload-types'
import type { GraphData, GraphNode, GraphEdge } from '@/components/StoryBuilder/types'

/**
 * GET /api/story-builder/graph-data
 * Returns graph visualization data (nodes and edges) for relationships
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const types = searchParams.get('types')?.split(',')
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    // Build where clause for relationships
    const where: any = { and: [] }

    if (types && types.length > 0) {
      where.and.push({ type: { in: types } })
    }

    if (yearFrom || yearTo) {
      const yearFilter: any = {}
      if (yearFrom) yearFilter.greater_than_equal = parseInt(yearFrom)
      if (yearTo) yearFilter.less_than_equal = parseInt(yearTo)
      where.and.push({ year: yearFilter })
    }

    if (minAmount || maxAmount) {
      const amountFilter: any = {}
      if (minAmount) amountFilter.greater_than_equal = parseInt(minAmount)
      if (maxAmount) amountFilter.less_than_equal = parseInt(maxAmount)
      where.and.push({ amount: amountFilter })
    }

    // Fetch relationships with populated entities
    const { docs: relationships } = await payload.find({
      collection: 'relationships',
      where: where.and.length > 0 ? where : {},
      depth: 2, // Populate from and to entities
      limit: 500, // Reasonable limit for visualization
    })

    // Extract unique entities from relationships
    const entityMap = new Map<number, Entity>()
    relationships.forEach((rel) => {
      const from = rel.from as Entity
      const to = rel.to as Entity

      if (from && typeof from !== 'number') {
        entityMap.set(from.id, from)
      }
      if (to && typeof to !== 'number') {
        entityMap.set(to.id, to)
      }
    })

    // Convert to graph format
    const nodes: GraphNode[] = Array.from(entityMap.values()).map((entity, index) => ({
      id: entity.id.toString(),
      data: {
        entity,
        label: entity.name,
        type: entity.type,
      },
      position: {
        // Simple circular layout - reactflow will handle force-directed layout
        x: 300 + 200 * Math.cos((index * 2 * Math.PI) / entityMap.size),
        y: 300 + 200 * Math.sin((index * 2 * Math.PI) / entityMap.size),
      },
      type: 'default',
    }))

    const edges: GraphEdge[] = relationships.map((rel) => {
      const from = rel.from as Entity | number
      const to = rel.to as Entity | number

      const fromId = typeof from === 'number' ? from.toString() : from.id.toString()
      const toId = typeof to === 'number' ? to.toString() : to.id.toString()

      return {
        id: `e-${rel.id}`,
        source: fromId,
        target: toId,
        data: {
          relationship: rel,
          label: rel.type + (rel.amount ? ` $${rel.amount.toLocaleString()}` : ''),
          amount: rel.amount || undefined,
        },
        type: 'default',
        animated: rel.type === 'Contract' || rel.type === 'Grant',
        style: {
          stroke: getRelationshipColor(rel.type),
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: getRelationshipColor(rel.type),
        },
      }
    })

    const graphData: GraphData = { nodes, edges }

    return NextResponse.json(graphData)
  } catch (error) {
    console.error('Graph data error:', error)
    return NextResponse.json({ error: 'Failed to load graph data' }, { status: 500 })
  }
}

/**
 * Get color for relationship type
 */
function getRelationshipColor(type: Relationship['type']): string {
  const colors = {
    Contract: '#3b82f6',
    Grant: '#10b981',
    Employment: '#f59e0b',
    Board: '#8b5cf6',
    Officer: '#ec4899',
    KeyEmployee: '#06b6d4',
    Other: '#6b7280',
  }
  return colors[type] || '#6b7280'
}
