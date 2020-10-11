import { Configuration } from 'file2variable-cli'

const config: Configuration = {
  base: 'packages/vue/src/',
  files: [
    '*.template.html',
    '*-schema.json'
  ],
  handler: (file: string) => {
    if (file.endsWith('.template.html')) {
      return {
        type: 'vue3',
      }
    }
    if (file.endsWith('.json')) {
      return { type: 'json' }
    }
    return { type: 'text' }
  },
  out: 'variables.ts'
}

export default config
