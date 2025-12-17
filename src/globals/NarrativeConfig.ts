import type { GlobalConfig } from 'payload'

export const NarrativeConfig: GlobalConfig = {
  slug: 'narrative-config',
  fields: [
    {
      name: 'prologue',
      type: 'richText',
      label: 'Prologue: The Blueprint',
    },
    {
      name: 'epilogue',
      type: 'richText',
      label: 'Epilogue: The Spoils',
    },
    {
      name: 'authors',
      type: 'text',
    },
    {
      name: 'version',
      type: 'text',
    },
  ],
}
