import { Endpoint } from 'payload/config'
import { Payload } from 'payload'

export const mergeEntities: Endpoint = {
  path: '/merge-entities',
  method: 'post',
  handler: async (req, res) => {
    if (!req.user) {
      return res.status(401).send({ message: 'Unauthorized.' })
    }

    const { fromId, toId } = req.body
    const { payload } = req

    if (!fromId || !toId) {
      return res.status(400).send({ message: 'Both fromId and toId are required.' })
    }

    if (fromId === toId) {
      return res.status(400).send({ message: 'Cannot merge an entity into itself.' })
    }

    try {
      const fromEntity = await payload.findByID({
        collection: 'entities',
        id: fromId,
      })

      const toEntity = await payload.findByID({
        collection: 'entities',
        id: toId,
      })

      if (fromEntity.name !== toEntity.name || fromEntity.type !== toEntity.type) {
        return res.status(400).send({
          message: 'Entities must have the same name and type to be merged.',
        })
      }

      await payload.db.transaction(async (tx) => {
        const db = tx
        // Re-parent 'from' relationships
        await db.run('UPDATE relationships SET "from" = ? WHERE "from" = ?;', [toId, fromId])

        // Re-parent 'to' relationships
        await db.run('UPDATE relationships SET "to" = ? WHERE "to" = ?;', [toId, fromId])

        // Delete the original entity
        await db.run('DELETE FROM entities WHERE id = ?;', [fromId])
      })

      res.status(200).send({ message: `Successfully merged entity ${fromId} into ${toId}.` })
    } catch (error) {
      payload.logger.error(error)
      res.status(500).send({ message: 'An error occurred while merging entities.' })
    }
  },
}
