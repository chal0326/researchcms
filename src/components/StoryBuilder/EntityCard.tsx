'use client'

import { useState } from 'react'
import type { EntityCardProps } from './types'
import { Building2, User, DollarSign, Network, TrendingUp } from 'lucide-react'

/**
 * Entity icon mapping
 */
const entityIcons = {
  Organization: Building2,
  Person: User,
  Fund: DollarSign,
  Corporation: Building2,
  Government: Building2,
}

/**
 * EntityCard Component
 * Displays entity information with optional analysis tools
 */
export function EntityCard({
  entity,
  showRelationships: _showRelationships = true,
  showEvents: _showEvents = true,
  onAnalyze,
}: EntityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = entityIcons[entity.type]

  return (
    <div className="entity-card border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-full bg-blue-50">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{entity.name}</h3>
            <p className="text-sm text-gray-500">{entity.type}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* EIN Badge */}
      {entity.ein && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            EIN: {entity.ein}
          </span>
        </div>
      )}

      {/* Aliases */}
      {entity.aliases && entity.aliases.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Also known as:</p>
          <div className="flex flex-wrap gap-1">
            {entity.aliases.map((alias, idx) => (
              <span
                key={alias.id || idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-700"
              >
                {alias.alias}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {/* Analysis Actions */}
          {onAnalyze && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Analysis Tools
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAnalyze(entity.id, 'circular-funding')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
                >
                  <Network className="w-4 h-4" />
                  Circular Funding
                </button>
                <button
                  onClick={() => onAnalyze(entity.id, 'self-dealing')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Self-Dealing
                </button>
                <button
                  onClick={() => onAnalyze(entity.id, 'network')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  <Network className="w-4 h-4" />
                  Network
                </button>
                <button
                  onClick={() => onAnalyze(entity.id, 'financial-timeline')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Financial
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          {entity.ledger_source_id && (
            <div>
              <p className="text-xs text-gray-500">Ledger ID: {entity.ledger_source_id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
