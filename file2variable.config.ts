export default {
  base: 'packages/vue/src/',
  files: [
    '*.template.html',
    '*-schema.json'
  ],
  handler: (file: string) => {
    if (file.endsWith('index.template.html')) {
      return {
        type: 'vue',
        name: 'Main',
        path: './index'
      }
    }
    if (file.endsWith('generate-matches.template.html')) {
      return {
        type: 'vue',
        name: 'GenerateMatches',
        path: './index'
      }
    }
    if (file.endsWith('.json')) {
      return { type: 'json' }
    }
    return { type: 'text' }
  },
  out: 'variables.ts'
}
