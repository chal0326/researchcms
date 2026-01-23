'use client'

import { useState } from 'react'
import { BookOpen, Share2, Download, Send } from 'lucide-react'
import { useStoryBuilder } from './hooks/useStoryBuilder'

export function PublicationControls() {
  const { selectedMountains, selectedEvents } = useStoryBuilder()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [publicationId, setPublicationId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const hasSelection = selectedMountains.length > 0 && selectedEvents.length > 0

  async function handlePublish() {
    if (!hasSelection) {
      alert('Please select at least one mountain and one event to publish')
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch('/api/story-builder/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Story Publication - ${new Date().toLocaleDateString()}`,
          description: 'Published story from Research CMS',
          mountainIds: selectedMountains.map((m) => m.id),
          eventIds: selectedEvents.map((e) => e.id),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPublicationId(result.publicationId)
        setShareUrl(result.shareUrl)
        alert(`Story published successfully! Share URL: ${result.shareUrl}`)
      } else {
        const error = await response.json()
        alert(`Publish failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish story')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleExport() {
    if (!publicationId) {
      alert('Please publish the story first')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/story-builder/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicationId,
          format: 'html',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Create download link
        const blob = new Blob([result.data], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const error = await response.json()
        alert(`Export failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export story')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleShare() {
    if (!publicationId) {
      alert('Please publish the story first')
      return
    }

    setIsSharing(true)
    try {
      const response = await fetch('/api/story-builder/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicationId,
          shareOptions: {
            width: '100%',
            height: '600px',
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShareUrl(result.shareUrl)
        // Copy to clipboard
        navigator.clipboard.writeText(result.shareUrl)
        alert(`Share URL copied to clipboard: ${result.shareUrl}`)
      } else {
        const error = await response.json()
        alert(`Share failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to generate share link')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="publication-controls flex gap-2">
      <button
        onClick={handlePublish}
        disabled={isPublishing || !hasSelection}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          isPublishing || !hasSelection
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        <Send className="w-4 h-4" />
        {isPublishing ? 'Publishing...' : 'Publish Story'}
      </button>

      <button
        onClick={handleExport}
        disabled={isExporting || !publicationId}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          isExporting || !publicationId
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      <button
        onClick={handleShare}
        disabled={isSharing || !publicationId}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          isSharing || !publicationId
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        <Share2 className="w-4 h-4" />
        {isSharing ? 'Generating...' : 'Share'}
      </button>

      {shareUrl && (
        <div className="ml-4 p-2 bg-gray-100 rounded-md text-sm">
          <span className="text-gray-600">Share URL:</span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            {shareUrl}
          </a>
        </div>
      )}
    </div>
  )
}
