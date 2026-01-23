import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { StoryPublication, TimelineEvent, Mountain } from '@/payload-types'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = request.headers.get('user-id')

    const body = await request.json()
    const { publicationId, format = 'html' } = body

    if (!publicationId) {
      return NextResponse.json({ error: 'Publication ID is required' }, { status: 400 })
    }

    // Get the publication
    const publication = await payload.findByID({
      collection: 'story-publications',
      id: publicationId,
      depth: 2, // Include mountains and events
    })

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 })
    }

    // Check access - user must be creator or publication must be public
    if (publication.status !== 'published' && publication.createdBy !== user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate export based on format
    let exportData: string

    switch (format) {
      case 'html':
        exportData = generateHtmlExport(publication)
        break
      case 'json':
        exportData = generateJsonExport(publication)
        break
      case 'markdown':
        exportData = generateMarkdownExport(publication)
        break
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      format,
      data: exportData,
      filename: `${publication.title.replace(/\s+/g, '-')}.${format}`,
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export', details: error.message },
      { status: 500 },
    )
  }
}

function generateHtmlExport(publication: StoryPublication): string {
  const mountains = publication.mountains as Mountain[]
  const events = publication.events as TimelineEvent[]

  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime(),
  )

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${publication.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .mountain { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
    .event { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #3b82f6; }
    .event-date { font-weight: bold; color: #3b82f6; }
    .sources { font-size: 0.9em; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${publication.title}</h1>
    ${publication.description ? `<p>${publication.description}</p>` : ''}
    <p>Published: ${new Date(publication.publicationDate).toLocaleDateString()}</p>
  </div>

  ${mountains
    .map(
      (mountain) => `
      <div class="mountain">
        <h2>${mountain.title}</h2>
        ${mountain.introduction ? `<div>${mountain.introduction}</div>` : ''}
        
        ${sortedEvents
          .filter((event) => event.mountains && event.mountains.some((m) => m.id === mountain.id))
          .map(
            (event) => `
            <div class="event">
              <div class="event-date">
                ${event.year}${event.month ? `/${event.month}` : ''}${event.day ? `/${event.day}` : ''}
              </div>
              <h3>${event.title}</h3>
              <div>${event.body}</div>
              ${
                event.sources && event.sources.length > 0
                  ? `
                <div class="sources">
                  Sources: ${event.sources
                    .map((source) =>
                      source.source ? (source.source as any).title || 'Unknown' : 'Unknown',
                    )
                    .join(', ')}
                </div>
              `
                  : ''
              }
            </div>
          `,
          )
          .join('')}
        
        ${mountain.conclusion ? `<div>${mountain.conclusion}</div>` : ''}
      </div>
    `,
    )
    .join('')}
</body>
</html>
`
}

function generateJsonExport(publication: StoryPublication): string {
  return JSON.stringify(
    {
      publication: {
        id: publication.id,
        title: publication.title,
        description: publication.description,
        publicationDate: publication.publicationDate,
        status: publication.status,
        shareUrl: publication.shareUrl,
        viewCount: publication.viewCount,
      },
      mountains: publication.mountains,
      events: publication.events,
    },
    null,
    2,
  )
}

function generateMarkdownExport(publication: StoryPublication): string {
  const mountains = publication.mountains as Mountain[]
  const events = publication.events as TimelineEvent[]

  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime(),
  )

  let markdown = `# ${publication.title}\n\n`
  markdown += `**Published:** ${new Date(publication.publicationDate).toLocaleDateString()}\n\n`
  markdown += `${publication.description ? `${publication.description}\n\n` : ''}`

  mountains.forEach((mountain) => {
    markdown += `## ${mountain.title}\n\n`
    markdown += `${mountain.introduction ? `${mountain.introduction}\n\n` : ''}`

    const mountainEvents = sortedEvents.filter(
      (event) => event.mountains && event.mountains.some((m) => m.id === mountain.id),
    )

    mountainEvents.forEach((event) => {
      markdown += `### ${event.year}${event.month ? `/${event.month}` : ''}${event.day ? `/${event.day}` : ''}: ${event.title}\n\n`
      markdown += `${event.body}\n\n`

      if (event.sources && event.sources.length > 0) {
        markdown += `**Sources:** ${event.sources
          .map((source) => (source.source ? (source.source as any).title || 'Unknown' : 'Unknown'))
          .join(', ')}\n\n`
      }
    })

    markdown += `${mountain.conclusion ? `${mountain.conclusion}\n\n` : ''}`
  })

  return markdown
}
