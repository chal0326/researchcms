import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = request.headers.get('user-id')

    const body = await request.json()
    const { publicationId, shareOptions = {} } = body

    if (!publicationId) {
      return NextResponse.json({ error: 'Publication ID is required' }, { status: 400 })
    }

    // Get the publication
    const publication = await payload.findByID({
      collection: 'story-publications',
      id: publicationId,
    })

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 })
    }

    // Check access - user must be creator or admin
    if (publication.createdBy !== user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate share URL if not already set
    if (!publication.shareUrl) {
      const updatedPublication = await payload.update({
        collection: 'story-publications',
        id: publicationId,
        data: {
          shareUrl: `/stories/${publication.id}`,
        },
        user: user,
        overrideAccess: false,
      })

      return NextResponse.json({
        success: true,
        shareUrl: updatedPublication.shareUrl,
        embedCode: generateEmbedCode(updatedPublication.shareUrl, shareOptions),
      })
    }

    return NextResponse.json({
      success: true,
      shareUrl: publication.shareUrl,
      embedCode: generateEmbedCode(publication.shareUrl, shareOptions),
    })
  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json(
      { error: 'Failed to generate share link', details: error.message },
      { status: 500 },
    )
  }
}

function generateEmbedCode(shareUrl: string, options: any = {}): string {
  const width = options.width || '100%'
  const height = options.height || '600px'
  const showTitle = options.showTitle !== false

  return `
<iframe 
  src="${shareUrl}?embedded=true"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #ccc; border-radius: 4px;"
  allowfullscreen
></iframe>

<script>
  // Optional: Auto-resize iframe to content
  window.addEventListener('message', function(e) {
    if (e.data.type === 'iframeResize') {
      const iframe = document.querySelector('iframe[src*="${shareUrl}"]');
      if (iframe) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>
`
}
