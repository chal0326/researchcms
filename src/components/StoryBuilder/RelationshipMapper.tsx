'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { GraphData, RelationshipFilter } from './types'
import { Filter } from 'lucide-react'

/**
 * Relationship type colors
 */
const relationshipColors = {
  Contract: '#3b82f6', // blue
  Grant: '#10b981', // green
  Employment: '#f59e0b', // amber
  Board: '#8b5cf6', // purple
  Officer: '#ec4899', // pink
  KeyEmployee: '#06b6d4', // cyan
  Other: '#6b7280', // gray
}

/**
 * RelationshipMapper Component
 * Interactive graph visualization of entity relationships
 */
export function RelationshipMapper() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filter, setFilter] = useState<RelationshipFilter>({})

  // Load graph data
  useEffect(() => {
    loadGraphData()
  }, [filter])

  async function loadGraphData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.types?.length) {
        params.append('types', filter.types.join(','))
      }
      if (filter.yearRange) {
        params.append('yearFrom', filter.yearRange[0].toString())
        params.append('yearTo', filter.yearRange[1].toString())
      }
      if (filter.minAmount) {
        params.append('minAmount', filter.minAmount.toString())
      }
      if (filter.maxAmount) {
        params.append('maxAmount', filter.maxAmount.toString())
      }

      const response = await fetch(`/api/story-builder/graph-data?${params}`)
      if (response.ok) {
        const data = (await response.json()) as GraphData
        setNodes(data.nodes)
        setEdges(data.edges)
      }
    } catch (error) {
      console.error('Failed to load graph data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node)
    // TODO: Show entity details in sidebar or modal
  }, [])

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge)
    // TODO: Show relationship details
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading relationship graph...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-gray-50 rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2 flex gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded hover:bg-gray-100 ${showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          title="Toggle Filters"
        >
          <Filter className="w-5 h-5" />
        </button>
        <button
          onClick={loadGraphData}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-16 left-4 z-10 bg-white rounded-lg shadow-lg p-4 w-80">
          <h3 className="font-semibold text-gray-900 mb-3">Filter Relationships</h3>

          {/* Relationship Types */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Types
            </label>
            <div className="space-y-1">
              {Object.keys(relationshipColors).map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filter.types?.includes(type as any) ?? false}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...(filter.types || []), type as any]
                        : (filter.types || []).filter((t) => t !== type)
                      setFilter({ ...filter, types: newTypes.length > 0 ? newTypes : undefined })
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: relationshipColors[type as keyof typeof relationshipColors],
                    }}
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Year Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="From"
                value={filter.yearRange?.[0] || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    yearRange: [parseInt(e.target.value) || 0, filter.yearRange?.[1] || 0],
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="To"
                value={filter.yearRange?.[1] || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    yearRange: [filter.yearRange?.[0] || 0, parseInt(e.target.value) || 0],
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min $"
                value={filter.minAmount || ''}
                onChange={(e) =>
                  setFilter({ ...filter, minAmount: parseInt(e.target.value) || undefined })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max $"
                value={filter.maxAmount || ''}
                onChange={(e) =>
                  setFilter({ ...filter, maxAmount: parseInt(e.target.value) || undefined })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <button
            onClick={() => setFilter({})}
            className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Relationship Types</h4>
        <div className="space-y-1">
          {Object.entries(relationshipColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md px-3 py-2">
        <p className="text-xs text-gray-600">
          <strong>{nodes.length}</strong> entities · <strong>{edges.length}</strong> relationships
        </p>
      </div>

      {/* ReactFlow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const entityType = node.data?.entity?.type
            const colorMap: Record<string, string> = {
              Organization: '#3b82f6',
              Person: '#10b981',
              Fund: '#f59e0b',
              Corporation: '#8b5cf6',
              Government: '#ec4899',
            }
            return colorMap[entityType] || '#6b7280'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
