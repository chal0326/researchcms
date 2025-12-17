import { seed } from '../../../../scripts/seed'
import { getPayload } from 'payload'
import config from '@payload-config'

export const GET = async () => {
  const payload = await getPayload({ config })
  try {
    await seed(payload)
    return Response.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
