import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { StoryPublication } from '@/payload-types'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = request.headers.get('user-id') // Get user from auth

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, mountainIds, eventIds, metadata } = body

    // Validate required fields
    if (!title || !mountainIds || !eventIds || mountainIds.length === 0 || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Title, mountains, and events are required' },
        { status: 400 },
      )
    }

    // Create the story publication
    const publicationData: Partial<StoryPublication> = {
      title,
      description: description || '',
      mountains: mountainIds,
      events: eventIds,
      status: 'published',
      publicationDate: new Date().toISOString(),
      exportFormats: ['html', 'json'], // Default formats
      createdBy: user,
      metadata: metadata || {},
    }

    const publication = await payload.create({
      collection: 'story-publications',
      data: publicationData,
      user: user, // Pass user for access control
      overrideAccess: false, // Enforce access control
    })

    // Update timeline events status to published
    await Promise.all(
      eventIds.map(async (eventId: string) => {
        await payload.update({
          collection: 'timeline-events',
          id: eventId,
          data: { status: 'published' },
          user: user,
          overrideAccess: false,
        })
      }),
    )

    return NextResponse.json({
      success: true,
      publicationId: publication.id,
      shareUrl: publication.shareUrl,
      message: 'Story published successfully',
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Failed to publish story', details: error.message },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = request.headers.get('user-id')

    // Get publications - if user is admin, show all; otherwise show public or user's own
    const where = user
      ? {
          or: [{ status: { equals: 'published' } }, { createdBy: { equals: user } }],
        }
      : { status: { equals: 'published' } }

    const { docs: publications } = await payload.find({
      collection: 'story-publications',
      where,
      depth: 1, // Include related data
      sort: '-publicationDate',
    })

    return NextResponse.json(publications)
  } catch (error) {
    console.error('Get publications error:', error)
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 })
  }
}
