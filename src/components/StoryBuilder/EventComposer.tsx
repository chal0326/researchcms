'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EventComposerProps } from './types'
import type { TimelineEvent, Entity, Mountain, Source } from '@/payload-types'
import { Mountain as MountainIcon, Users, FileText, Save, X, Wand2 } from 'lucide-react'

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

/**
 * EventComposer Component
 * Rich editor for creating and editing timeline events
 */
export function EventComposer({ eventId, onSave, onCancel }: EventComposerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    year: new Date().getFullYear(),
    month: '',
    day: '',
    sequence: 1,
    body: '',
    mountains: [] as number[],
    isConvergencePoint: false,
    entities: [] as { entity: number; context?: string }[],
    sources: [] as { source: number; reference_location: string; quote?: string }[],
  })

  // Available options (fetched from API)
  const [mountains, setMountains] = useState<Mountain[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [sources, setSources] = useState<Source[]>([])

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      loadEvent(eventId)
    }
    loadOptions()
  }, [eventId])

  async function loadEvent(id: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/timeline-events/${id}`)
      if (response.ok) {
        const event = (await response.json()) as TimelineEvent
        setFormData({
          id: event.id,
          title: event.title,
          year: typeof event.year === 'string' ? parseInt(event.year) : event.year,
          month: event.month || '',
          day: event.day ? event.day.toString() : '',
          sequence: event.sequence || 1,
          body: JSON.stringify(event.body), // Lexical format
          mountains: event.mountains.map((m: Mountain | number) =>
            typeof m === 'number' ? m : m.id,
          ),
          isConvergencePoint: event.isConvergencePoint || false,
          entities:
            event.entities?.map((e) => ({
              entity: typeof e.entity === 'number' ? e.entity : e.entity.id,
              context: e.context,
            })) || [],
          sources:
            event.sources?.map((s) => ({
              source: typeof s.source === 'number' ? s.source : s.source.id,
              reference_location: s.reference_location,
              quote: s.quote,
            })) || [],
        })
      }
    } catch (error) {
      console.error('Failed to load event:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadOptions() {
    try {
      const [mountainsRes, entitiesRes, sourcesRes] = await Promise.all([
        fetch('/api/mountains'),
        fetch('/api/entities'),
        fetch('/api/sources'),
      ])

      if (mountainsRes.ok) {
        const data = (await mountainsRes.json()) as { docs: Mountain[] }
        setMountains(data.docs || [])
      }
      if (entitiesRes.ok) {
        const data = (await entitiesRes.json()) as { docs: Entity[] }
        setEntities(data.docs || [])
      }
      if (sourcesRes.ok) {
        const data = (await sourcesRes.json()) as { docs: Source[] }
        setSources(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to load options:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const endpoint = eventId ? `/api/timeline-events/${eventId}` : '/api/timeline-events'
      const method = eventId ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year.toString()),
          day: formData.day ? parseInt(formData.day.toString()) : null,
          body: formData.body ? JSON.parse(formData.body) : undefined,
        }),
      })

      if (response.ok) {
        const savedEvent = (await response.json()) as TimelineEvent
        onSave?.(savedEvent)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setSaving(false)
    }
  }

  function addEntity() {
    setFormData((prev) => ({
      ...prev,
      entities: [...prev.entities, { entity: 0, context: '' }],
    }))
  }

  function removeEntity(index: number) {
    setFormData((prev) => ({
      ...prev,
      entities: prev.entities.filter((_, i) => i !== index),
    }))
  }

  function addSource() {
    setFormData((prev) => ({
      ...prev,
      sources: [...prev.sources, { source: 0, reference_location: '', quote: '' }],
    }))
  }

  function removeSource(index: number) {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="event-composer h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          {eventId ? 'Edit Event' : 'Create Timeline Event'}
        </h2>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        {/* Date & Sequence */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YYYY"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">(Optional)</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <input
              type="number"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DD"
              min="1"
              max="31"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
            <input
              type="number"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* Mountains */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MountainIcon className="w-4 h-4" />
            Mountains (Storylines)
          </label>
          <div className="space-y-2">
            {mountains.map((mountain) => (
              <label key={mountain.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.mountains.includes(mountain.id)}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mountains: e.target.checked
                        ? [...formData.mountains, mountain.id]
                        : formData.mountains.filter((id) => id !== mountain.id),
                    })
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{mountain.title}</span>
                {mountain.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: mountain.color }}
                  />
                )}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={formData.isConvergencePoint}
              onChange={(e) => setFormData({ ...formData, isConvergencePoint: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mark as Convergence Point</span>
          </label>
        </div>

        {/* Event Body */}
        {/* Event Body with Enrichment Tools */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Event Description</label>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => {
                /* TODO: Implement Enrichment */
                alert('Enrichment Tool: Checking for potential entity links...')
              }}
            >
              <Wand2 className="w-3 h-3" />
              Enrich Content
            </button>
          </div>

          <textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Describe the event... Use the Enrich button to find connections."
            required
          />
        </div>

        {/* Entities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Entities Involved
            </label>
            <button
              type="button"
              onClick={addEntity}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Entity
            </button>
          </div>
          <div className="space-y-3">
            {formData.entities.map((item, index) => (
              <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-md">
                <div className="flex-1 space-y-2">
                  <select
                    value={item.entity}
                    onChange={(e) => {
                      const updated = [...formData.entities]
                      updated[index].entity = parseInt(e.target.value)
                      setFormData({ ...formData, entities: updated })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">Select entity...</option>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.context || ''}
                    onChange={(e) => {
                      const updated = [...formData.entities]
                      updated[index].context = e.target.value
                      setFormData({ ...formData, entities: updated })
                    }}
                    placeholder="Context (e.g., 'Payer of $5k')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEntity(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Source Citations
            </label>
            <button
              type="button"
              onClick={addSource}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Source
            </button>
          </div>
          <div className="space-y-3">
            {formData.sources.map((item, index) => (
              <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-md">
                <div className="flex-1 space-y-2">
                  <select
                    value={item.source}
                    onChange={(e) => {
                      const updated = [...formData.sources]
                      updated[index].source = parseInt(e.target.value)
                      setFormData({ ...formData, sources: updated })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">Select source...</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.reference_location}
                    onChange={(e) => {
                      const updated = [...formData.sources]
                      updated[index].reference_location = e.target.value
                      setFormData({ ...formData, sources: updated })
                    }}
                    placeholder="Page/Location (e.g., 'Page 42, para 3')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <textarea
                    value={item.quote || ''}
                    onChange={(e) => {
                      const updated = [...formData.sources]
                      updated[index].quote = e.target.value
                      setFormData({ ...formData, sources: updated })
                    }}
                    placeholder="Direct quote or excerpt (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
