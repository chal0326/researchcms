import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('merges entities via the custom endpoint', async () => {
    // Log in a user to get a token
    const user = await payload.login({
      collection: 'users',
      email: 'dev@payloadcms.com',
      password: 'password',
    })

    // Create the first entity
    const entity1 = await payload.create({
      collection: 'entities',
      data: {
        name: 'Entity 1',
        type: 'Person',
        source_file: 'file1.txt',
      },
    })

    // Create the second entity
    const entity2 = await payload.create({
      collection: 'entities',
      data: {
        name: 'Entity 1',
        type: 'Person',
        source_file: 'file2.txt',
      },
    })

    // Create a relationship from entity2 to another entity
    const relationship = await payload.create({
      collection: 'relationships',
      data: {
        from: entity2.id,
        to: entity1.id,
        type: 'ASSOCIATED_WITH',
      },
    })

    // Call the custom endpoint to merge the entities
    const response = await fetch(`${payload.getAPIURL()}/merge-entities`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${user.token}`,
      },
      body: JSON.stringify({
        fromId: entity2.id,
        toId: entity1.id,
      }),
    })

    expect(response.status).toBe(200)

    // Verify that the relationship has been updated
    const updatedRelationship = await payload.findByID({
      collection: 'relationships',
      id: relationship.id,
    })
    expect(updatedRelationship.from).toBe(entity1.id)
    expect(updatedRelationship.to).toBe(entity1.id)

    // Verify that the original entity has been deleted
    await expect(
      payload.findByID({
        collection: 'entities',
        id: entity2.id,
      }),
    ).rejects.toThrow()
  })

  it('prevents merging entities with different names', async () => {
    // Log in a user to get a token
    const user = await payload.login({
      collection: 'users',
      email: 'dev@payloadcms.com',
      password: 'password',
    })

    // Create the first entity
    const entity1 = await payload.create({
      collection: 'entities',
      data: {
        name: 'Entity 1',
        type: 'Person',
        source_file: 'file1.txt',
      },
    })

    // Create the second entity
    const entity2 = await payload.create({
      collection: 'entities',
      data: {
        name: 'Entity 2',
        type: 'Person',
        source_file: 'file2.txt',
      },
    })

    // Call the custom endpoint to merge the entities
    const response = await fetch(`${payload.getAPIURL()}/merge-entities`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${user.token}`,
      },
      body: JSON.stringify({
        fromId: entity2.id,
        toId: entity1.id,
      }),
    })

    expect(response.status).toBe(400)
  })

  it('prevents merging an entity into itself', async () => {
    // Log in a user to get a token
    const user = await payload.login({
      collection: 'users',
      email: 'dev@payloadcms.com',
      password: 'password',
    })

    // Create the first entity
    const entity1 = await payload.create({
      collection: 'entities',
      data: {
        name: 'Entity 1',
        type: 'Person',
        source_file: 'file1.txt',
      },
    })

    // Call the custom endpoint to merge the entities
    const response = await fetch(`${payload.getAPIURL()}/merge-entities`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${user.token}`,
      },
      body: JSON.stringify({
        fromId: entity1.id,
        toId: entity1.id,
      }),
    })

    expect(response.status).toBe(400)
  })
})
