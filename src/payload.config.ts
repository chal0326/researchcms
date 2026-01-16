import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { mcpPlugin } from '@payloadcms/plugin-mcp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Mountains } from './collections/Mountains'
import { Entities } from './collections/Entities'
import { Relationships } from './collections/Relationships'
import { TimelineEvents } from './collections/TimelineEvents'
import { Sources } from './collections/Sources'
import { NarrativeConfig } from './globals/NarrativeConfig'

const filename =
  import.meta.url && import.meta.url.startsWith('file:') ? fileURLToPath(import.meta.url) : ''
const dirname = filename ? path.dirname(filename) : ''

const isCLI = process.argv.some((value) => value.match(/^(generate|migrate):?/))
const isProduction = process.env.NODE_ENV === 'production'

const cloudflare = (globalThis as any).__CLOUDFLARE_ENV__
  ? { env: (globalThis as any).__CLOUDFLARE_ENV__ }
  : isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Define a custom view
      views: {
        SourceImporter: {
          Component: '/components/SourceImporter/index.tsx',
          path: '/ingest-sources',
        },
        StoryBuilder: {
          Component: '/components/StoryBuilder/index.tsx',
          path: '/story-builder',
        },
      },
    },
  },
  collections: [Users, Media, Mountains, Entities, Relationships, TimelineEvents, Sources],
  globals: [NarrativeConfig],
  editor: lexicalEditor(),
  secret:
    process.env.PAYLOAD_SECRET ||
    (cloudflare.env as { PAYLOAD_SECRET?: string }).PAYLOAD_SECRET ||
    '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    logger: true,
    push: false,
  }),
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        persist: false, // Ensure we don't save anything locally
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: true, // ALWAYS use remote bindings
      } satisfies GetPlatformProxyOptions),
  )
}
