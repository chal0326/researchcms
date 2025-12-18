/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const wrapHandler = (handler: any) => async (req: any, args: any) => {
  const url = new URL(req.url)

  // MANUAL MCP IMPLEMENTATION
  // The official plugin is incompatible with Cloudflare Workers (500 crash).
  // We implement a basic MCP server over SSE here.

  // 1. SSE Handshake (GET /api/mcp)
  if (req.method === 'GET' && url.pathname.endsWith('/api/mcp')) {
    console.log('[MCP] New connection request')

    const sessionId = crypto.randomUUID()
    const messageEndpoint = `/api/mcp/messages?sessionId=${sessionId}`

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        // Send the 'endpoint' event telling the client where to POST messages
        // This is the standard HTTP-SSE transport for MCP
        const event = `event: endpoint\ndata: ${messageEndpoint}\n\n`
        controller.enqueue(encoder.encode(event))

        // We don't close the stream immediately; keep it open?
        // Standard MCP over SSE keeps connection open for logs/notifications.
        // For now, we just keep it alive.
        // Ideally send a heartbeat or just wait.
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // 2. Message Handling (POST /api/mcp/messages OR just /api/mcp)
  // We widen this to catch initialization requests that might come to the root
  if (req.method === 'POST' && url.pathname.includes('/api/mcp')) {
    console.log('[MCP] Message received')
    try {
      const body = await req.json()
      const payload = await getPayload({ config })
      if (body.method === 'tools/list') {
        console.log('[MCP] Handling tools/list')
        const collections = ['mountains', 'entities', 'timeline-events', 'users']
        const tools = []

        for (const slug of collections) {
          // Read Tool
          tools.push({
            name: `read_${slug}`,
            description: `Retrieve ${slug} from the CMS.`,
            inputSchema: {
              type: 'object',
              properties: {
                where: { type: 'object', description: 'Payload CMS where query' },
                limit: { type: 'number' },
                page: { type: 'number' },
                sort: { type: 'string' },
              },
            },
          })
          // Create Tool
          tools.push({
            name: `create_${slug}`,
            description: `Create a new ${slug} in the CMS.`,
            inputSchema: {
              type: 'object',
              properties: {
                data: { type: 'object', description: 'The data to create' },
              },
              required: ['data'],
            },
          })
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result: { tools },
        })
      }

      if (body.method === 'tools/call') {
        const { name, arguments: args } = body.params
        console.log(`[MCP] Executing tool: ${name}`)

        const [operation, ...slugParts] = name.split('_')
        const collectionSlug = slugParts.join('_') // Handle 'timeline_events' vs 'timeline-events' if needed

        // Validate collection (simple check)
        const validCollections = ['mountains', 'entities', 'timeline-events', 'users']
        // Note: slug in tool name might need normalization if we used underscores.
        // But we defined them with the exact slug strings above (e.g. read_timeline-events).

        if (!validCollections.includes(collectionSlug)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32602, message: `Unknown collection: ${collectionSlug}` },
          })
        }

        let result

        if (operation === 'read') {
          const { where, limit, page, sort } = args || {}
          const data = await payload.find({
            collection: collectionSlug as any,
            where,
            limit: limit || 10,
            page: page || 1,
            sort,
          })
          result = { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
        } else if (operation === 'create') {
          const { data } = args || {}
          const doc = await payload.create({
            collection: collectionSlug as any,
            data,
          })
          result = { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] }
        } else {
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32601, message: `Unknown operation: ${operation}` },
          })
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result,
        })
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Method not implemented yet' },
      })
    } catch (e) {
      console.error('[MCP] Message parse error', e)
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
    }
  }

  // For non-MCP routes, just execute the handler normally
  try {
    return await handler(req, args)
  } catch (error) {
    console.error(`[Handler Error] ${req.method} ${req.url} failed:`, error)
    throw error
  }
}

export const GET = wrapHandler(REST_GET(config))
export const POST = wrapHandler(REST_POST(config))
export const DELETE = wrapHandler(REST_DELETE(config))
export const PATCH = wrapHandler(REST_PATCH(config))
export const PUT = wrapHandler(REST_PUT(config))
export const OPTIONS = wrapHandler(REST_OPTIONS(config))
