'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { StoryBuilderState, StoryBuilderView, TimelineEvent, Entity, Mountain } from '../types'

/**
 * Story Builder Context
 */
interface StoryBuilderContextValue extends StoryBuilderState {
  setActiveView: (view: StoryBuilderView) => void
  setCurrentEvent: (event: TimelineEvent | null) => void
  setSelectedEntity: (entity: Entity | null) => void
  setActiveMountain: (mountain: Mountain | null) => void
  setIsDraft: (isDraft: boolean) => void
  addSelectedMountain: (mountain: Mountain) => void
  removeSelectedMountain: (mountainId: number) => void
  addSelectedEvent: (event: TimelineEvent) => void
  removeSelectedEvent: (eventId: string) => void
  clearSelections: () => void
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
  selectedMountains: [],
  selectedEvents: [],
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

  const addSelectedMountain = useCallback((mountain: Mountain) => {
    setState((prev) => ({
      ...prev,
      selectedMountains: [...prev.selectedMountains, mountain],
    }))
  }, [])

  const removeSelectedMountain = useCallback((mountainId: number) => {
    setState((prev) => ({
      ...prev,
      selectedMountains: prev.selectedMountains.filter((m) => m.id !== mountainId),
    }))
  }, [])

  const addSelectedEvent = useCallback((event: TimelineEvent) => {
    setState((prev) => ({
      ...prev,
      selectedEvents: [...prev.selectedEvents, event],
    }))
  }, [])

  const removeSelectedEvent = useCallback((eventId: string) => {
    setState((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.filter((e) => e.id !== eventId),
    }))
  }, [])

  const clearSelections = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedMountains: [],
      selectedEvents: [],
    }))
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
    addSelectedMountain,
    removeSelectedMountain,
    addSelectedEvent,
    removeSelectedEvent,
    clearSelections,
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
