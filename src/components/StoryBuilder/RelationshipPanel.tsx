'use client'

import { useState } from 'react'
import type { Entity, Relationship } from '@/payload-types'
import { Plus, Trash2, Download } from 'lucide-react'

interface RelationshipPanelProps {
  onRefresh?: () => void
}

/**
 * RelationshipPanel Component
 * Side panel for creating and managing relationships
 */
export function RelationshipPanel({ onRefresh }: RelationshipPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    from: 0,
    to: 0,
    type: 'Contract' as Relationship['type'],
    year: new Date().getFullYear(),
    amount: 0,
    description: '',
    role: '',
  })

  const [entities, setEntities] = useState<Entity[]>([])

  // Load entities for dropdowns
  useState(() => {
    loadEntities()
    loadRelationships()
  })

  async function loadEntities() {
    try {
      const response = await fetch('/api/entities?limit=1000')
      if (response.ok) {
        const data = (await response.json()) as { docs: Entity[] }
        setEntities(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to load entities:', error)
    }
  }

  async function loadRelationships() {
    setLoading(true)
    try {
      const response = await fetch('/api/relationships?limit=100&sort=-createdAt')
      if (response.ok) {
        const data = (await response.json()) as { docs: Relationship[] }
        setRelationships(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to load relationships:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRelationship(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          from: 0,
          to: 0,
          type: 'Contract',
          year: new Date().getFullYear(),
          amount: 0,
          description: '',
          role: '',
        })
        loadRelationships()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to create relationship:', error)
    }
  }

  async function handleDeleteRelationship(id: number) {
    if (!confirm('Are you sure you want to delete this relationship?')) return

    try {
      const response = await fetch(`/api/relationships/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadRelationships()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to delete relationship:', error)
    }
  }

  async function handleExportCSV() {
    // Simple CSV export
    const csv = [
      ['From', 'To', 'Type', 'Year', 'Amount', 'Description', 'Role'].join(','),
      ...relationships.map((r) =>
        [
          typeof r.from === 'number' ? r.from : r.from.name,
          typeof r.to === 'number' ? r.to : r.to.name,
          r.type,
          r.year || '',
          r.amount || '',
          `"${r.description || ''}"`,
          r.role || '',
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relationships-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Relationships</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Relationship
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <form onSubmit={handleCreateRelationship} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Entity</label>
              <select
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="0">Select entity...</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} ({entity.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Entity</label>
              <select
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="0">Select entity...</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} ({entity.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="Contract">Contract</option>
                <option value="Grant">Grant</option>
                <option value="Employment">Employment</option>
                <option value="Board">Board Member</option>
                <option value="Officer">Officer</option>
                <option value="KeyEmployee">Key Employee</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Service description, context..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Relationship List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No relationships yet</p>
            <p className="text-xs text-gray-400 mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {relationships.map((relationship) => {
              const fromEntity = typeof relationship.from === 'number' ? null : relationship.from
              const toEntity = typeof relationship.to === 'number' ? null : relationship.to

              return (
                <div
                  key={relationship.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {fromEntity?.name || `Entity #${relationship.from}`}
                        <span className="text-gray-400 mx-2">→</span>
                        {toEntity?.name || `Entity #${relationship.to}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {relationship.type}
                        </span>
                        {relationship.year && (
                          <span className="text-xs text-gray-500">{relationship.year}</span>
                        )}
                        {relationship.amount && (
                          <span className="text-xs text-gray-500">
                            ${relationship.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRelationship(relationship.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Delete relationship"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {relationship.description && (
                    <p className="text-xs text-gray-600 mt-1">{relationship.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
