# Payload CMS Development Rules

You are an expert Payload CMS developer. Follow these rules:

## Core Principles

1. **TypeScript-First**: Use proper types from `payload` and your generated types.
2. **Security-Critical**: Follow strict access control patterns.
3. **Type Generation**: Run `generate:types` after schema changes.
4. **Transaction Safety**: Pass `req` to all nested operations in hooks.
5. **Access Control**: Always handle `overrideAccess: false` in Local API.

## Project Structure

```
src/
├── collections/             # Collection Configs
├── globals/                 # Global Configs
├── components/              # Custom React Components
├── hooks/                   # Business Logic Hooks
├── access/                  # Access Control Functions
└── payload.config.ts        # Main Config
```

## Security Patterns (CRITICAL)

### 1. Local API Access Control

When using `payload.find/create/update/delete` with a specific user, you **MUST** set `overrideAccess: false`. By default, Local API operates as Admin (bypasses access control).

```typescript
// ✅ SECURE
await payload.find({
  collection: 'posts',
  user: currentUser,
  overrideAccess: false, // REQUIRED to enforce permissions
})
```

### 2. Transaction Safety

Pass `req` to all nested Local API calls within hooks to maintain atomicity and performance.

```typescript
// ✅ ATOMIC
afterChange: [
  async ({ doc, req }) => {
    await req.payload.create({
      collection: 'audit-log',
      data: { docId: doc.id },
      req, // Puts this operation in the same transaction
    })
  },
],
```

### 3. Infinite Loop Prevention

Use `context` to skip recursive hooks.

```typescript
// ✅ SAFE
if (context.skipHooks) return
await req.payload.update({
  // ...
  context: { skipHooks: true },
  req,
})
```

## Configuration & Collections

Use the minimal config pattern needed. Split collections into separate files.

```typescript
// src/collections/Posts.ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
}
```

## Access Control

### Patterns

- **Boolean**: Simple yes/no (e.g., `({ req: { user } }) => Boolean(user)`).
- **Query Constraint**: Row-level security (e.g., return `{ author: { equals: user.id } }`).
- **Field Level**: Returns boolean ONLY. Cannot return query constraints.

### Best Practices

1. **Default Deny**: Start restrictive, add permissions.
2. **Save Roles to JWT**: Use `saveToJWT: true` on role fields to avoid DB lookups in access control.
3. **Avoid Async**: Prefer simple checks or JWT data over database calls in access functions.

## Hooks

Common hooks: `beforeValidate`, `beforeChange`, `afterChange`, `afterRead`, `beforeDelete`.

- **beforeChange**: formatting, validation, linking data.
- **afterChange**: side effects (email, sync), logging.
- **afterRead**: virtual fields, sanitization (careful with perf).

## Queries (Local API)

Use standard operators: `equals`, `not_equals`, `contains`, `in`, `exists`, `greater_than`, `less_than`.

```typescript
// Complex Query
const posts = await payload.find({
  collection: 'posts',
  where: {
    and: [{ status: { equals: 'published' } }, { 'author.name': { contains: 'john' } }],
  },
  limit: 10,
})
```

## Custom Components

Components can be Server (default) or Client (`'use client'`) components. Define paths in config.

```typescript
// payload.config.ts
admin: {
  components: {
    afterDashboard: ['/components/Analytics'],
  },
}
```

**Client Component Rules:**

- Use `'use client'`.
- Use hooks (`useAuth`, `useConfig`, `useDocumentInfo`) from `@payloadcms/ui`.
- Minimize props serialization.

## Best Practices & Gotchas

1. **Override Access**: Always double-check `overrideAccess: false` when meant to impersonate a user.
2. **Relations**: Default depth is often 2. Set `depth: 0` if you only need IDs.
3. **Data Integrity**: Always await async hooks.
4. **Environment**: Separate secrets from code. Use `process.env`.
5. **Types**: Trust generated types. Do not manually type generic documents if `payload-types` exists.
6. **Globals**: Use for singletons (site settings, navigation).
7. **Plugins**: Use standard plugins (`@payloadcms/plugin-seo`, etc.) before building custom.

## Resources

- Docs: https://payloadcms.com/docs
- LLM Context: https://payloadcms.com/llms-full.txt
- GitHub: https://github.com/payloadcms/payload
