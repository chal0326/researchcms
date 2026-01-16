'use client'

import { useState } from 'react'
import { StoryBuilderProvider, useStoryBuilder } from './hooks/useStoryBuilder'
import { EventComposer } from './EventComposer'
import { EntityCard } from './EntityCard'
import { RelationshipMapper } from './RelationshipMapper'
import { RelationshipPanel } from './RelationshipPanel'
import type { StoryBuilderView, AnalysisType } from './types'
import { Calendar, Network, Mountain as MountainIcon, PlusCircle, Search } from 'lucide-react'

/**
 * Story Builder Main View
 */
function StoryBuilderContent() {
  const { activeView, setActiveView, setCurrentEvent } = useStoryBuilder()
  const [showEventComposer, setShowEventComposer] = useState(false)

  function handleViewChange(view: StoryBuilderView) {
    setActiveView(view)
    setShowEventComposer(false)
  }

  function handleNewEvent() {
    setCurrentEvent(null)
    setShowEventComposer(true)
  }

  function handleAnalyze(entityId: number, analysisType: AnalysisType) {
    console.log('Analyzing entity:', entityId, 'Type:', analysisType)
    // TODO: Implement analysis API calls
    alert(`Analysis feature coming soon!\nEntity: ${entityId}\nType: ${analysisType}`)
  }

  return (
    <div className="story-builder h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Story Builder</h1>
            <p className="text-sm text-gray-500 mt-1">
              Craft narratives, analyze connections, and build your research story
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewEvent}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Event
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 mt-4" role="tablist">
          <button
            role="tab"
            aria-selected={activeView === 'timeline'}
            onClick={() => handleViewChange('timeline')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeView === 'timeline'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Timeline View
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'graph'}
            onClick={() => handleViewChange('graph')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeView === 'graph'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Network className="w-4 h-4" />
            Relationship Graph
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'mountains'}
            onClick={() => handleViewChange('mountains')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeView === 'mountains'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MountainIcon className="w-4 h-4" />
            Mountains View
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {showEventComposer ? (
          <div className="h-full">
            <EventComposer
              onSave={() => {
                setShowEventComposer(false)
                // TODO: Refresh data
              }}
              onCancel={() => setShowEventComposer(false)}
            />
          </div>
        ) : (
          <div className="h-full p-6">
            {activeView === 'timeline' && <TimelineView onAnalyze={handleAnalyze} />}
            {activeView === 'graph' && <GraphView />}
            {activeView === 'mountains' && <MountainsView />}
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Timeline View (Placeholder)
 */
function TimelineView({ onAnalyze }: { onAnalyze: (id: number, type: AnalysisType) => void }) {
  // Sample entity for demonstration
  const sampleEntity = {
    id: 1,
    name: 'Sample Organization',
    type: 'Organization' as const,
    ein: '12-3456789',
    aliases: [{ id: '1', alias: 'Sample Org' }],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Timeline Events</h2>
        <p className="text-sm text-gray-500 mt-1">
          View and manage events chronologically across all mountains
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Interactive timeline with filtering, searching, and bulk
            operations.
          </p>
        </div>

        {/* Demo Entity Card */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Example Entity Card:</h3>
          <EntityCard entity={sampleEntity} onAnalyze={onAnalyze} />
        </div>
      </div>
    </div>
  )
}

/**
 * Graph View
 */
function GraphView() {
  const [showPanel, setShowPanel] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="h-full flex relative">
      <div className={`flex-1 transition-all ${showPanel ? 'pr-96' : ''}`}>
        <RelationshipMapper key={refreshKey} />
      </div>
      {showPanel && (
        <div className="absolute right-0 top-0 w-96 h-full">
          <RelationshipPanel onRefresh={() => setRefreshKey((k) => k + 1)} />
        </div>
      )}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="absolute right-4 top-4 z-20 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-sm"
      >
        {showPanel ? 'Hide Panel' : 'Show Panel'}
      </button>
    </div>
  )
}

/**
 * Mountains View (Placeholder)
 */
function MountainsView() {
  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Mountains (Narrative Threads)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Organize events by storyline with drag-and-drop
        </p>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm text-green-800">
          <strong>Phase 4:</strong> Kanban-style board with columns for each mountain. Drag events
          between storylines and identify convergence points.
        </p>
      </div>
    </div>
  )
}

/**
 * Main Export - Story Builder wrapped in Provider
 */
export default function StoryBuilder() {
  return (
    <StoryBuilderProvider>
      <StoryBuilderContent />
    </StoryBuilderProvider>
  )
}
