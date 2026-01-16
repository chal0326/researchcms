'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  StoryBuilderState,
  StoryBuilderView,
  TimelineEvent,
  Entity,
  Mountain,
} from '../types'

/**
 * Story Builder Context
 */
interface StoryBuilderContextValue extends StoryBuilderState {
  setActiveView: (view: StoryBuilderView) => void
  setCurrentEvent: (event: TimelineEvent | null) => void
  setSelectedEntity: (entity: Entity | null) => void
  setActiveMountain: (mountain: Mountain | null) => void
  setIsDraft: (isDraft: boolean) => void
  resetState: () => void
}

const StoryBuilderContext = createContext<StoryBuilderContextValue | undefined>(undefined)

/**
 * Initial state
 */
const initialState: StoryBuilderState = {
  activeView: 'timeline',
  currentEvent: null,
  selectedEntity: null,
  activeMountain: null,
  isDraft: false,
}

/**
 * Story Builder Provider
 */
export function StoryBuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoryBuilderState>(initialState)

  const setActiveView = useCallback((view: StoryBuilderView) => {
    setState((prev) => ({ ...prev, activeView: view }))
  }, [])

  const setCurrentEvent = useCallback((event: TimelineEvent | null) => {
    setState((prev) => ({ ...prev, currentEvent: event }))
  }, [])

  const setSelectedEntity = useCallback((entity: Entity | null) => {
    setState((prev) => ({ ...prev, selectedEntity: entity }))
  }, [])

  const setActiveMountain = useCallback((mountain: Mountain | null) => {
    setState((prev) => ({ ...prev, activeMountain: mountain }))
  }, [])

  const setIsDraft = useCallback((isDraft: boolean) => {
    setState((prev) => ({ ...prev, isDraft }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [])

  const value: StoryBuilderContextValue = {
    ...state,
    setActiveView,
    setCurrentEvent,
    setSelectedEntity,
    setActiveMountain,
    setIsDraft,
    resetState,
  }

  return <StoryBuilderContext.Provider value={value}>{children}</StoryBuilderContext.Provider>
}

/**
 * Hook to use Story Builder context
 */
export function useStoryBuilder() {
  const context = useContext(StoryBuilderContext)
  if (!context) {
    throw new Error('useStoryBuilder must be used within StoryBuilderProvider')
  }
  return context
}
