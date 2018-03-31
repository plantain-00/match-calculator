import Vue from 'vue'
import Component from 'vue-class-component'
import 'tab-container-vue-component'
import Ajv from 'ajv'
import { Subject } from 'rxjs/Subject'
import { indexTemplateHtml, indexTemplateHtmlStatic, groupsSchemaJson, teamsSchemaJson, generateMatchesTemplateHtml, generateMatchesTemplateHtmlStatic } from './variables'
import * as types from './types'
import { GroupChance, Message } from './worker'
import * as monaco from 'monaco-editor'

const ajv = new Ajv()
const validateGroups = ajv.compile(groupsSchemaJson)
const validateTeams = ajv.compile(teamsSchemaJson)
const worker = new Worker('worker.bundle.js')
const resultSubject = new Subject<Message>()

worker.onmessage = e => {
  const message: Message = e.data
  resultSubject.next(message)
}

const defaultGroups = `[
    {
        "teams": [
            "AAA",
            "BBB",
            "CCC"
        ],
        "matches": [
            { "a": "AAA", "b": "BBB", "possibilities": [ { "a": 3, "b": 0 } ] },
            { "a": "AAA", "b": "CCC", "possibilities": [ { "a": 3, "b": 0 }, { "a": 1, "b": 1 } ] },
            { "a": "BBB", "b": "CCC", "possibilities": [ { "a": 3, "b": 0 }, { "a": 1, "b": 1 }, { "a": 0, "b": 3 } ] }
        ],
        "tops": [2]
    }
]`
const defaultTeams = `[
    "AAA",
    "BBB",
    "CCC"
]`

const groupsLocalStorageKey = 'groups'
const teamsLocalStorageKey = 'teams'

function printInConsole (message: any) {
  console.log(message)
}

var editors: {[name: string]: EditorData} = {
  main: {
    code: localStorage.getItem(groupsLocalStorageKey) || defaultGroups
  },
  generateMatches: {
    code: localStorage.getItem(teamsLocalStorageKey) || defaultTeams
  },
  generateMatchesResult: {
    code: ''
  }
};
var isGenerateMatchesLoaded = false;
function loadEditor(value: EditorData) {
  if (value.element) {
    value.editor = monaco.editor.create(value.element, {
      value: value.code,
      language: "json"
    })
  }
}

@Component({
  render: indexTemplateHtml,
  staticRenderFns: indexTemplateHtmlStatic
})
export class Main extends Vue {
  result: GroupChance[] = []
  errorMessage = ''
  progressText = ''
  private calculating = false

  mounted () {
    resultSubject.subscribe(message => {
      if (message.type === 'initial-result') {
        this.result = message.result
      } else if (message.type === 'final-result') {
        this.calculating = false
        this.result = message.result
        this.progressText = ''
      } else {
        this.progressText = message.progress
      }
    })
    editors.main.element = this.$refs.mainEditor as HTMLElement
    loadEditor(editors.main)
  }

  beforeDestroy () {
    resultSubject.unsubscribe()
  }

  calculate () {
    if (this.calculating) {
      this.errorMessage = 'calculating...'
      return
    }

    try {
      const json = editors.main.editor!.getValue()
      localStorage.setItem(groupsLocalStorageKey, json)

      const groups: types.Groups = JSON.parse(json)
      if (!validateGroups(groups)) {
        printInConsole(validateGroups.errors)
        this.errorMessage = validateGroups.errors![0].schemaPath + ': ' + validateGroups.errors![0].message
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
      this.calculating = true
    } catch (error) {
      this.errorMessage = error.message
      this.result = []
    }
  }
}

@Component({
  render: generateMatchesTemplateHtml,
  staticRenderFns: generateMatchesTemplateHtmlStatic
})
export class GenerateMatches extends Vue {
  errorMessage = ''

  mounted () {
    editors.generateMatches.element = this.$refs.generateMatchesEditor as HTMLElement
    editors.generateMatchesResult.element = this.$refs.generateMatchesResultEditor as HTMLElement
  }

  generate () {
    try {
      const json = editors.generateMatches.editor!.getValue()
      localStorage.setItem(teamsLocalStorageKey, json)

      const teams: string[] = JSON.parse(json)
      if (!validateTeams(teams)) {
        printInConsole(validateTeams.errors)
        this.errorMessage = validateTeams.errors![0].schemaPath + ': ' + validateTeams.errors![0].message
        editors.generateMatchesResult.editor!.setValue('')
        return
      }
      const result: string[] = []
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          result.push(`            { "a": "${teams[i]}", "b": "${teams[j]}", "possibilities": [] }`)
        }
      }
      editors.generateMatchesResult.editor!.setValue(`[\n${result.join(',\n')}\n]`)
      this.errorMessage = ''
    } catch (error) {
      this.errorMessage = error.message
      editors.generateMatchesResult.editor!.setValue('')
    }
  }
}

Vue.component('main-page', Main)

Vue.component('generate-matches', GenerateMatches)

@Component({
  render (this: App, createElement) {
    return createElement('tab-container', {
      props: {
        data: this.data
      },
      on: {
        switching: ($event: number) => this.switching($event)
      }
    })
  }
})
class App extends Vue {
  private data = [
    {
      isActive: true,
      title: 'Main',
      component: 'main-page'
    },
    {
      isActive: false,
      title: 'Generate Matches',
      component: 'generate-matches'
    }
  ]

  private switching (index: number) {
    if (index === 1 && !isGenerateMatchesLoaded) {
      Vue.nextTick(() => {
        Vue.nextTick(() => {
          loadEditor(editors.generateMatches)
          loadEditor(editors.generateMatchesResult)
          isGenerateMatchesLoaded = true
        })
      })
    }
  }
}

// tslint:disable-next-line:no-unused-expression
new App({ el: '#container' })

if (navigator.serviceWorker && !location.host.startsWith('localhost')) {
  navigator.serviceWorker.register('service-worker.bundle.js').catch(error => {
    printInConsole('registration failed with error: ' + error)
  })
}

type EditorData = {
  element?: HTMLElement;
  code: string;
  editor?: {
    getValue (): string;
    setValue (code: string): void;
  };
}
