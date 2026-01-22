import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Entity, Relationship } from '@/payload-types'

/**
 * GET /api/story-builder/analysis
 * Performs algorithmic analysis on the entity-relationship graph
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const searchParams = request.nextUrl.searchParams
    const analysisType = searchParams.get('type') || 'centrality'
    const entityId = searchParams.get('entityId')

    // Fetch all relationships with entities
    const { docs: relationships } = await payload.find({
      collection: 'relationships',
      depth: 1,
      limit: 1000,
    })

    // Build adjacency list
    const graph = new Map<number, number[]>()
    const reverseGraph = new Map<number, number[]>()
    const entityMap = new Map<number, Entity>()

    relationships.forEach((rel) => {
      const from = rel.from as Entity | number
      const to = rel.to as Entity | number

      const fromId = typeof from === 'number' ? from : from.id
      const toId = typeof to === 'number' ? to : to.id

      if (!graph.has(fromId)) graph.set(fromId, [])
      if (!graph.has(toId)) graph.set(toId, [])
      if (!reverseGraph.has(fromId)) reverseGraph.set(fromId, [])
      if (!reverseGraph.has(toId)) reverseGraph.set(toId, [])

      graph.get(fromId)!.push(toId)
      reverseGraph.get(toId)!.push(fromId)

      if (typeof from !== 'number') entityMap.set(from.id, from)
      if (typeof to !== 'number') entityMap.set(to.id, to)
    })

    let results: any = {}

    switch (analysisType) {
      case 'centrality':
        results = calculateDegreeCentrality(graph, reverseGraph, entityMap)
        break
      case 'betweenness':
        results = calculateBetweennessCentrality(graph, entityMap)
        break
      case 'clustering':
        results = calculateClusteringCoefficient(graph, entityMap)
        break
      case 'components':
        results = findConnectedComponents(graph, entityMap)
        break
      case 'paths':
        if (entityId) {
          results = calculateShortestPaths(parseInt(entityId), graph, entityMap)
        }
        break
      default:
        results = { error: 'Unknown analysis type' }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 })
  }
}

/**
 * Calculate degree centrality for all nodes
 */
function calculateDegreeCentrality(
  graph: Map<number, number[]>,
  reverseGraph: Map<number, number[]>,
  entityMap: Map<number, Entity>,
) {
  const centrality: { entity: Entity; inDegree: number; outDegree: number; totalDegree: number }[] =
    []

  for (const [entityId, entity] of entityMap) {
    const outDegree = graph.get(entityId)?.length || 0
    const inDegree = reverseGraph.get(entityId)?.length || 0
    centrality.push({
      entity,
      inDegree,
      outDegree,
      totalDegree: inDegree + outDegree,
    })
  }

  return centrality.sort((a, b) => b.totalDegree - a.totalDegree)
}

/**
 * Calculate betweenness centrality (simplified)
 */
function calculateBetweennessCentrality(
  graph: Map<number, number[]>,
  entityMap: Map<number, Entity>,
) {
  const betweenness = new Map<number, number>()

  // Initialize
  for (const entityId of entityMap.keys()) {
    betweenness.set(entityId, 0)
  }

  // For each node, calculate shortest paths
  for (const startId of entityMap.keys()) {
    const distances = new Map<number, number>()
    const paths = new Map<number, number>()
    const queue: number[] = []

    distances.set(startId, 0)
    paths.set(startId, 1)
    queue.push(startId)

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentDist = distances.get(current)!

      for (const neighbor of graph.get(current) || []) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1)
          paths.set(neighbor, paths.get(current)!)
          queue.push(neighbor)
        } else if (distances.get(neighbor)! === currentDist + 1) {
          paths.set(neighbor, paths.get(neighbor)! + paths.get(current)!)
        }
      }
    }

    // Accumulate betweenness
    for (const endId of entityMap.keys()) {
      if (startId !== endId && paths.has(endId)) {
        betweenness.set(endId, betweenness.get(endId)! + paths.get(endId)!)
      }
    }
  }

  return Array.from(betweenness.entries())
    .map(([entityId, score]) => ({
      entity: entityMap.get(entityId)!,
      betweenness: score,
    }))
    .sort((a, b) => b.betweenness - a.betweenness)
}

/**
 * Calculate clustering coefficient
 */
function calculateClusteringCoefficient(
  graph: Map<number, number[]>,
  entityMap: Map<number, Entity>,
) {
  const clustering: { entity: Entity; coefficient: number }[] = []

  for (const [entityId, entity] of entityMap) {
    const neighbors = graph.get(entityId) || []
    if (neighbors.length < 2) {
      clustering.push({ entity, coefficient: 0 })
      continue
    }

    let triangles = 0
    const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighbor1 = neighbors[i]
        const neighbor2 = neighbors[j]
        if (
          graph.get(neighbor1)?.includes(neighbor2) ||
          graph.get(neighbor2)?.includes(neighbor1)
        ) {
          triangles++
        }
      }
    }

    const coefficient = possibleTriangles > 0 ? triangles / possibleTriangles : 0
    clustering.push({ entity, coefficient })
  }

  return clustering.sort((a, b) => b.coefficient - a.coefficient)
}

/**
 * Find connected components
 */
function findConnectedComponents(graph: Map<number, number[]>, entityMap: Map<number, Entity>) {
  const visited = new Set<number>()
  const components: Entity[][] = []

  function dfs(node: number, component: Entity[]) {
    if (visited.has(node)) return
    visited.add(node)
    const entity = entityMap.get(node)
    if (entity) component.push(entity)

    for (const neighbor of graph.get(node) || []) {
      dfs(neighbor, component)
    }
  }

  for (const entityId of entityMap.keys()) {
    if (!visited.has(entityId)) {
      const component: Entity[] = []
      dfs(entityId, component)
      if (component.length > 0) {
        components.push(component)
      }
    }
  }

  return components.sort((a, b) => b.length - a.length)
}

/**
 * Calculate shortest paths from a given entity
 */
function calculateShortestPaths(
  startId: number,
  graph: Map<number, number[]>,
  entityMap: Map<number, Entity>,
) {
  const distances = new Map<number, number>()
  const previous = new Map<number, number>()
  const queue: number[] = []

  distances.set(startId, 0)
  queue.push(startId)

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentDist = distances.get(current)!

    for (const neighbor of graph.get(current) || []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1)
        previous.set(neighbor, current)
        queue.push(neighbor)
      }
    }
  }

  const paths: { entity: Entity; distance: number; path: Entity[] }[] = []

  for (const [entityId, distance] of distances) {
    if (entityId === startId) continue

    const entity = entityMap.get(entityId)
    if (!entity) continue

    // Reconstruct path
    const path: Entity[] = []
    let current = entityId
    while (current !== startId) {
      const prevEntity = entityMap.get(current)
      if (prevEntity) path.unshift(prevEntity)
      current = previous.get(current)!
      if (!current) break
    }
    path.unshift(entityMap.get(startId)!)

    paths.push({ entity, distance, path })
  }

  return paths.sort((a, b) => a.distance - b.distance)
}
