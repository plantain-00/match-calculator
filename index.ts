import { createApp, defineComponent, h, nextTick } from 'vue'
import { TabContainer } from 'tab-container-vue-component'
import Ajv from 'ajv'
import { Subject } from 'rxjs'
import { indexTemplateHtml, groupsSchemaJson, matchPossibilitySchemaJson, generateMatchesTemplateHtml } from './variables'
import * as types from './types'
import { GroupChance, Message } from './worker'
import * as monaco from 'monaco-editor'
import JSON5 from 'json5'

const ajv = new Ajv()
const validateGroups = ajv.compile(groupsSchemaJson)
const validateMatchPossibility = ajv.compile(matchPossibilitySchemaJson)
const worker = new Worker('worker.bundle.js')
const resultSubject = new Subject<Message>()

worker.onmessage = (e: { data: Message }) => {
  const message = e.data
  resultSubject.next(message)
}

const defaultGroups = `[
  {
    teams: [
      'AAA',
      'BBB',
      'CCC',
    ],
    matches: [
      { a: 'AAA', b: 'BBB', possibilities: [{ a: 3, b: 0 }] },
      { a: 'AAA', b: 'CCC', possibilities: [{ a: 3, b: 0 }, { a: 1, b: 1 }] },
      { a: 'BBB', b: 'CCC', possibilities: [{ a: 3, b: 0 }, { a: 1, b: 1 }, { a: 0, b: 3 }] },
    ],
    tops: [2],
  },
]`
const defaultTeams = `{
  teams: [
    'AAA',
    'BBB',
    'CCC',
  ],
  possibilities: [{ a: 2, b: 0 }, { a: 1, b: 1 }, { a: 0, b: 2 }],
}`

const groupsLocalStorageKey = 'groups'
const teamsLocalStorageKey = 'teams'

function printInConsole(message: unknown) {
  console.log(message)
}

const editors: { [name: string]: EditorData } = {
  main: {
    code: localStorage.getItem(groupsLocalStorageKey) || defaultGroups
  },
  generateMatches: {
    code: localStorage.getItem(teamsLocalStorageKey) || defaultTeams
  },
  generateMatchesResult: {
    code: ''
  }
}
let isGenerateMatchesLoaded = false
function loadEditor(value: EditorData) {
  if (value.element) {
    value.editor = monaco.editor.create(value.element, {
      value: value.code,
      language: 'typescript'
    })
  }
}

const Main = defineComponent({
  render: indexTemplateHtml,
  data: () => {
    return {
      result: [] as GroupChance[],
      errorMessage: '',
      progressText: '',
    }
  },
  mounted() {
    resultSubject.subscribe(message => {
      if (message.type === 'initial-result') {
        this.result = message.result
      } else if (message.type === 'final-result') {
        this.result = message.result
        this.progressText = ''
      } else {
        this.progressText = message.progress
      }
    })
    editors.main.element = this.$refs.mainEditor as HTMLElement
    loadEditor(editors.main)
  },
  beforeDestroy() {
    resultSubject.unsubscribe()
  },
  methods: {
    calculate() {
      try {
        const json = editors.main.editor!.getValue()
        localStorage.setItem(groupsLocalStorageKey, json)

        const groups: types.Groups = JSON5.parse(json)
        if (!validateGroups(groups)) {
          if (validateGroups.errors) {
            printInConsole(validateGroups.errors)
            this.errorMessage = validateGroups.errors[0].schemaPath + ': ' + validateGroups.errors[0].message
          }
          this.result = []
          return
        }

        for (const group of groups) {
          for (const match of group.matches) {
            if (group.teams.indexOf(match.a) === -1) {
              this.errorMessage = `team name "${match.a}" should be in teams.`
              this.result = []
              return
            }
            if (group.teams.indexOf(match.b) === -1) {
              this.errorMessage = `team name "${match.b}" should be in teams.`
              this.result = []
              return
            }
          }
        }

        worker.postMessage(groups)
        this.errorMessage = ''
      } catch (error: unknown) {
        this.errorMessage = error instanceof Error ? error.message : String(error)
        this.result = []
      }
    }
  }
})

const GenerateMatches = defineComponent({
  render: generateMatchesTemplateHtml,
  data: () => {
    return {
      errorMessage: ''
    }
  },
  mounted() {
    editors.generateMatches.element = this.$refs.generateMatchesEditor as HTMLElement
    editors.generateMatchesResult.element = this.$refs.generateMatchesResultEditor as HTMLElement
  },
  methods: {
    generate() {
      try {
        const json = editors.generateMatches.editor!.getValue()
        localStorage.setItem(teamsLocalStorageKey, json)
  
        const teamsInfo: types.MatchPossibilities = JSON5.parse(json)
        if (!validateMatchPossibility(teamsInfo)) {
          if (validateMatchPossibility.errors) {
            printInConsole(validateMatchPossibility.errors)
            this.errorMessage = validateMatchPossibility.errors[0].schemaPath + ': ' + validateMatchPossibility.errors[0].message
          }
          if (editors.generateMatchesResult.editor) {
            editors.generateMatchesResult.editor.setValue('')
          }
          return
        }
        const { teams, possibilities } = teamsInfo[0]
        const result: string[] = []
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const ps = possibilities.map((p => `{ a: ${p.a}, b: ${p.b} }`)).join(', ')
            result.push(`  { a: '${teams[i]}', b: '${teams[j]}', possibilities: [${ps}] },`)
          }
        }
        editors.generateMatchesResult.editor!.setValue(`[\n${result.join('\n')}\n]`)
        this.errorMessage = ''
      } catch (error: unknown) {
        this.errorMessage = error instanceof Error ? error.message : String(error)
        editors.generateMatchesResult.editor!.setValue('')
      }
    }
  }
})

const App = defineComponent({
  render() {
    return h(TabContainer, {
      data: this.data,
      onSwitching: ($event: number) => this.switching($event)
    })
  },
  data: () => {
    return {
      data: [
        {
          isActive: true,
          title: 'Main',
          component: 'main-page',
          data: '',
        },
        {
          isActive: false,
          title: 'Generate Matches',
          component: 'generate-matches',
          data: '',
        }
      ]
    }
  },
  methods: {
    switching(index: number) {
      if (index === 1 && !isGenerateMatchesLoaded) {
        nextTick(() => {
          nextTick(() => {
            loadEditor(editors.generateMatches)
            loadEditor(editors.generateMatchesResult)
            isGenerateMatchesLoaded = true
          })
        })
      }
    }
  }
})

const app = createApp(App)
app.component('main-page', Main)
app.component('generate-matches', GenerateMatches)
app.mount('#container')

if (navigator.serviceWorker && !location.host.startsWith('localhost')) {
  navigator.serviceWorker.register('service-worker.bundle.js').catch((error: Error) => {
    printInConsole('registration failed with error: ' + error)
  })
}

interface EditorData {
  element?: HTMLElement;
  code: string;
  editor?: monaco.editor.IStandaloneCodeEditor;
}
