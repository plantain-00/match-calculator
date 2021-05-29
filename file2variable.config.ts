import { Configuration } from 'file2variable-cli'

const config: Configuration = {
  files: [
    '*-schema.json'
  ],
  handler: (file: string) => {
    if (file.endsWith('.json')) {
      return { type: 'json' }
    }
    return { type: 'text' }
  },
  out: 'variables.ts'
}

export default config
