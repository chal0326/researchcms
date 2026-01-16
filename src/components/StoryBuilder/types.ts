import type { Entity, Mountain, Relationship, Source, TimelineEvent } from '@/payload-types'

// Re-export for convenience
export type { Entity, Mountain, Relationship, Source, TimelineEvent }

/**
 * Story Builder View Modes
 */
export type StoryBuilderView = 'timeline' | 'graph' | 'mountains'

/**
 * Story Builder State
 */
export interface StoryBuilderState {
  /** Current active view */
  activeView: StoryBuilderView
  /** Currently selected/editing event */
  currentEvent: TimelineEvent | null
  /** Currently selected entity for contextual actions */
  selectedEntity: Entity | null
  /** Currently active mountain filter */
  activeMountain: Mountain | null
  /** Whether in draft mode */
  isDraft: boolean
}

/**
 * Event Composer Props
 */
export interface EventComposerProps {
  eventId?: string
  onSave?: (event: TimelineEvent) => void
  onCancel?: () => void
}

/**
 * Entity Card Props
 */
export interface EntityCardProps {
  entity: Entity
  showRelationships?: boolean
  showEvents?: boolean
  onAnalyze?: (entityId: number, analysisType: AnalysisType) => void
}

/**
 * Analysis Types
 */
export type AnalysisType = 'circular-funding' | 'self-dealing' | 'network' | 'financial-timeline'

/**
 * Analysis Job Status
 */
export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * Analysis Job
 */
export interface AnalysisJob {
  id: string
  type: AnalysisType
  entityId: number
  status: AnalysisStatus
  createdAt: string
  completedAt?: string
  error?: string
}

/**
 * Circular Funding Result
 */
export interface CircularFundingResult {
  detected: boolean
  chains: CircularFundingChain[]
  summary: string
}

export interface CircularFundingChain {
  entities: Entity[]
  relationships: Relationship[]
  totalAmount: number
  confidence: number
}

/**
 * Self-Dealing Result
 */
export interface SelfDealingResult {
  detected: boolean
  cases: SelfDealingCase[]
  summary: string
}

export interface SelfDealingCase {
  entity: Entity
  relatedParties: Entity[]
  relationships: Relationship[]
  description: string
  severity: 'low' | 'medium' | 'high'
}

/**
 * Network Analysis Result
 */
export interface NetworkAnalysisResult {
  centralEntities: {
    entity: Entity
    degree: number
    betweenness: number
  }[]
  clusters: {
    id: string
    entities: Entity[]
    connections: number
  }[]
  anomalies: {
    entity: Entity
    reason: string
  }[]
}

/**
 * Graph Data for Visualization
 */
export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNode {
  id: string
  data: {
    entity: Entity
    label: string
    type: Entity['type']
  }
  position: { x: number; y: number }
  type?: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  data: {
    relationship: Relationship
    label: string
    amount?: number
  }
  type?: string
  animated?: boolean
  style?: Record<string, unknown>
}

/**
 * Mountain Event Data (for kanban view)
 */
export interface MountainEventData {
  mountain: Mountain
  events: TimelineEvent[]
}

/**
 * Relationship Filter
 */
export interface RelationshipFilter {
  types?: Relationship['type'][]
  yearRange?: [number, number]
  minAmount?: number
  maxAmount?: number
}

/**
 * API Response Types
 */
export interface StoryBuilderDataResponse {
  events: TimelineEvent[]
  entities: Entity[]
  relationships: Relationship[]
  mountains: Mountain[]
  sources: Source[]
}

export interface AnalysisResponse<T = unknown> {
  jobId: string
  status: AnalysisStatus
  result?: T
  error?: string
}

/**
 * Convergence Point Detection
 */
export interface ConvergencePoint {
  event: TimelineEvent
  mountains: Mountain[]
  significance: number
}
