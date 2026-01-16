'use client'

import React, { useState } from 'react'
import { Gutter } from '@payloadcms/ui'

const SourceImporter: React.FC = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleImport = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Basic CSV Parser
      // Assume Header row
      const lines = input.trim().split('\n')
      if (lines.length < 2) throw new Error('CSV must have header and at least one row')

      const headers = lines[0].split(',').map((h) => h.trim())
      const data = lines.slice(1).map((line) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // Split by comma ignoring quotes
        const obj: any = {}
        headers.forEach((h, i) => {
          let val = values[i] ? values[i].trim() : ''
          // Remove surrounding quotes
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          obj[h] = val
        })
        return obj
      })

      const req = await fetch('/api/ingest-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await req.json()
      setResult(json)
    } catch (e: any) {
      setResult({ error: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Gutter>
      <h1>Bulk Source Importer</h1>
      <p style={{ marginBottom: '20px' }}>
        Paste CSV data below. First row must be headers:{' '}
        <code>Title, Type, Author, URL, Events</code>
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Title, Type, Author, URL, Events\n"My Source", "Book", "John", "", "event-id-1"`}
        style={{
          width: '100%',
          height: '300px',
          padding: '10px',
          fontFamily: 'monospace',
          marginBottom: '20px',
          border: '1px solid #333',
          background: '#222',
          color: '#fff',
        }}
      />

      <button
        onClick={handleImport}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          background: isLoading ? '#555' : '#0070f3',
          color: 'white',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Importing...' : 'Run Import'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#333' }}>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </Gutter>
  )
}

export default SourceImporter
