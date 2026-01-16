import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { syncLedgerToPayload } from '../../../../tools/SyncTool'

export const POST = async () => {
  try {
    const { env } = await getCloudflareContext()

    // Quick security check - in prod use a secret header or proper auth
    // For now allowing it as this is a research tool

    const stats = await syncLedgerToPayload(env)

    return NextResponse.json({
      message: 'Sync completed successfully',
      stats,
    })
  } catch (error: any) {
    console.error('Sync failed:', error)
    return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 })
  }
}
