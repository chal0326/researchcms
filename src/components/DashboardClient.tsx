'use client'

import React, { useState, useEffect } from 'react'

export function DashboardClient({
  initialStats,
}: {
  initialStats: { entities: number; relationships: number }
}) {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [isSweeping, setIsSweeping] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [cursor, setCursor] = useState<string | null>(null)

  const [batchStats, setBatchStats] = useState({
    files: 0,
    chunks: 0,
    entities: 0,
    rels: 0,
  })

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100))
  }

  const runBatch = async (currentCursor: string | null) => {
    setLoading(true)
    addLog(`Processing batch (Cursor: ${currentCursor || 'Start'})...`)

    try {
      const res = await fetch('/api/extract-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 10, // Increased limit per batch
          cursor: currentCursor || undefined,
          prefix: 'uploads/',
        }),
      })

      const data = (await res.json()) as any

      if (data.success) {
        setBatchStats((prev) => ({
          files: prev.files + data.stats.files,
          chunks: prev.chunks + data.stats.chunks,
          entities: prev.entities + data.stats.entitiesCreated,
          rels: prev.rels + data.stats.relationshipsCreated,
        }))

        addLog(
          `Batch Done: ${data.stats.files} files, ${data.stats.chunks} chunks, ${data.stats.entitiesCreated} new entities.`,
        )
        setCursor(data.next_cursor)

        // Refresh global stats
        const statsRes = await fetch('/api/stats')
        const newStats = await statsRes.json()
        setStats(newStats as any)

        return data.next_cursor
      } else {
        addLog(`Error: ${data.error}`)
        return null
      }
    } catch (err: any) {
      addLog(`Failed: ${err.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  const startSweep = async () => {
    setIsSweeping(true)
    addLog('--- INITIALIZING FULL SWEEP ---')

    let next = cursor
    while (true) {
      next = await runBatch(next)
      if (!next) {
        addLog('--- SWEEP COMPLETE (No more documents) ---')
        break
      }
      if (!isSweeping) {
        addLog('--- SWEEP INTERRUPTED BY USER ---')
        break
      }
    }
    setIsSweeping(false)
  }

  const stopSweep = () => {
    setIsSweeping(false)
    addLog('Stopping after current batch...')
  }

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Entities</span>
          <span className="stat-value">{stats.entities}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Relationships</span>
          <span className="stat-value">{stats.relationships}</span>
        </div>
      </div>

      <div className="session-progress">
        <div className="p-item">
          <span>Files:</span> <strong>{batchStats.files}</strong>
        </div>
        <div className="p-item">
          <span>Chunks:</span> <strong>{batchStats.chunks}</strong>
        </div>
        <div className="p-item">
          <span>New Ents:</span> <strong>{batchStats.entities}</strong>
        </div>
        <div className="p-item">
          <span>New Rels:</span> <strong>{batchStats.rels}</strong>
        </div>
      </div>

      <div className="controls">
        {!isSweeping ? (
          <button onClick={startSweep} disabled={loading} className="sweep-button">
            {loading ? 'Processing...' : 'Power Sweep uploads/'}
          </button>
        ) : (
          <button onClick={stopSweep} className="stop-button">
            Stop Auto-Sweep
          </button>
        )}
        <button
          onClick={() => runBatch(cursor)}
          disabled={loading || isSweeping}
          className="batch-button"
        >
          Single Batch
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            addLog('Triggering full background sync...')
            const res = await fetch('/api/extraction/automagic', { method: 'POST' })
            const data = (await res.json()) as any
            addLog(data.message || 'Sync triggered.')
            setLoading(false)
          }}
          disabled={loading || isSweeping}
          className="batch-button"
          style={{ borderColor: 'rgba(0, 255, 0, 0.3)' }}
        >
          Sync Background
        </button>
      </div>

      <div className="logs-container">
        <div className="logs-header">
          <h3>Live Extraction Stream</h3>
          {loading && <div className="pulse-indicator" />}
        </div>
        <div className="logs-list">
          {logs.length === 0 && <p className="empty-logs">System idle. Ready for extraction.</p>}
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2.5rem;
          color: white;
          background: rgba(13, 13, 13, 0.9);
          border-radius: 20px;
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 800px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        .stat-value {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(180deg, #fff 0%, #888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .session-progress {
          display: flex;
          justify-content: space-around;
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .p-item span {
          color: rgba(255, 255, 255, 0.4);
          margin-right: 0.5rem;
        }
        .p-item strong {
          color: #fff;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .button-base {
          padding: 1rem 2rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
        }
        .sweep-button {
          flex: 2;
          background: #fff;
          color: #000;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }
        .sweep-button:hover:not(:disabled) {
          background: #ccc;
          transform: scale(1.02);
        }
        .stop-button {
          flex: 2;
          background: #ff4444;
          color: #fff;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }
        .batch-button {
          flex: 1;
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .batch-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .logs-container {
          background: #000;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .logs-header h3 {
          margin: 0;
          font-size: 1rem;
          opacity: 0.8;
        }
        .pulse-indicator {
          width: 10px;
          height: 10px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ff00;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .logs-list {
          height: 200px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .log-entry {
          padding: 0.3rem 0;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .empty-logs {
          color: rgba(255, 255, 255, 0.3);
          text-align: center;
          margin-top: 4rem;
        }
      `}</style>
    </div>
  )
}
