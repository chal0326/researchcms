import { getPayload } from 'payload'
import config from '@/payload.config'
import { DashboardClient } from '@/components/DashboardClient'
import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Research CMS Dashboard',
  description: 'Monitor Knowledge Graph Extraction progress.',
}

export default async function DashboardPage() {
  const payload = await getPayload({ config })

  const entityCount = await payload.find({
    collection: 'entities',
    limit: 0,
  })

  const relationshipCount = await payload.find({
    collection: 'relationships',
    limit: 0,
  })

  return (
    <div className="home">
      <div className="content">
        <h1>Graph Monitor</h1>
        <p>Real-time oversight of the investigative extraction pipeline.</p>

        <DashboardClient
          initialStats={{
            entities: entityCount.totalDocs,
            relationships: relationshipCount.totalDocs,
          }}
        />

        <div className="links" style={{ marginTop: '2rem' }}>
          <Link href="/admin" className="admin">
            Open Payload Admin
          </Link>
          <Link href="/" className="docs">
            Back to Home
          </Link>
        </div>
      </div>

      <div className="footer">
        <p>Built with Payload + Cloudflare Workers</p>
      </div>
    </div>
  )
}
