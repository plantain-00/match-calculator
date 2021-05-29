import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { TabContainer } from 'tab-container-react-component'
import Ajv from 'ajv'
import { Subject } from 'rxjs'
import { groupsSchemaJson, matchPossibilitySchemaJson } from './variables'
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
const defaultTeams = `[
  {
    teams: [
      'AAA',
      'BBB',
      'CCC',
    ],
    possibilities: [{ a: 2, b: 0 }, { a: 1, b: 1 }, { a: 0, b: 2 }],
  },
]`

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

function Main() {
  const [result, setResult] = React.useState<GroupChance[]>([])
  const [errorMessage, setErrorMessage] = React.useState('')
  const [progressText, setProgressText] = React.useState('')

  const mainEditor = React.useRef<HTMLDivElement | null>(null)

  const calculate = () => {
    try {
      const json = editors.main.editor!.getValue()
      localStorage.setItem(groupsLocalStorageKey, json)

      const groups: types.Groups = JSON5.parse(json)
      if (!validateGroups(groups)) {
        if (validateGroups.errors) {
          printInConsole(validateGroups.errors)
          setErrorMessage(validateGroups.errors[0].schemaPath + ': ' + validateGroups.errors[0].message)
        }
        setResult([])
        return
      }

      for (const group of groups) {
        for (const match of group.matches) {
          if (group.teams.indexOf(match.a) === -1) {
            setErrorMessage(`team name "${match.a}" should be in teams.`)
            setResult([])
            return
          }
          if (group.teams.indexOf(match.b) === -1) {
            setErrorMessage(`team name "${match.b}" should be in teams.`)
            setResult([])
            return
          }
        }
      }

      worker.postMessage(groups)
      setErrorMessage('')
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
      setResult([])
    }
  }

  React.useEffect(() => {
    resultSubject.subscribe(message => {
      if (message.type === 'initial-result') {
        setResult(message.result)
      } else if (message.type === 'final-result') {
        setResult(message.result)
        setProgressText('')
      } else {
        setProgressText(message.progress)
      }
    })
    return () => resultSubject.unsubscribe()
  }, [])

  React.useEffect(() => {
    if (mainEditor.current && !editors.main.element) {
      editors.main.element = mainEditor.current
      loadEditor(editors.main)
    }
  }, [mainEditor.current])

  return (
    <div className="main">
      <div className="editor" ref={mainEditor}></div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <button onClick={calculate}>{progressText || "Calculate"}</button>
      <div className="result">
        {result.map((group, i) => (
          <table key={i}>
            <thead>
              <tr>
                <th>group {i + 1}</th>
                {group.tops.map((top, j) => <th key={j}>top {top} chance(%)</th>)}
                <th>score</th>
                <th>match count left</th>
              </tr>
            </thead>
            <tbody>
              {group.chances.map((team, j) => (
                <tr key={j}>
                  <td>{team.name}</td>
                  {team.chances.map((chance, k) => <th key={k}>{chance}</th>)}
                  <td>{team.score}</td>
                  <td>{team.matchCountLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  )
}

function GenerateMatches() {
  const [errorMessage, setErrorMessage] = React.useState('')
  const generateMatchesEditor = React.useRef<HTMLDivElement | null>(null)
  const generateMatchesResultEditor = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (generateMatchesEditor.current && !editors.generateMatches.element) {
      editors.generateMatches.element = generateMatchesEditor.current
    }
    if (generateMatchesResultEditor.current && !editors.generateMatchesResult.element) {
      editors.generateMatchesResult.element = generateMatchesResultEditor.current
    }
  }, [generateMatchesEditor.current, generateMatchesResultEditor.current])

  const generate = () => {
    try {
      const json = editors.generateMatches.editor!.getValue()
      localStorage.setItem(teamsLocalStorageKey, json)

      const teamsInfo: types.MatchPossibilities = JSON5.parse(json)
      if (!validateMatchPossibility(teamsInfo)) {
        if (validateMatchPossibility.errors) {
          printInConsole(validateMatchPossibility.errors)
          setErrorMessage(validateMatchPossibility.errors[0].schemaPath + ': ' + validateMatchPossibility.errors[0].message)
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
      setErrorMessage('')
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
      editors.generateMatchesResult.editor!.setValue('')
    }
  }

  return (
    <div className="generate-matches">
      <div className="editor" ref={generateMatchesEditor}></div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <button onClick={generate}>Generate</button>
      <div className="editor" ref={generateMatchesResultEditor}></div>
    </div>
  )
}

function App() {
  const switching = (index: number) => {
    if (index === 1 && !isGenerateMatchesLoaded) {
      setTimeout(() => {
        loadEditor(editors.generateMatches)
        loadEditor(editors.generateMatchesResult)
        isGenerateMatchesLoaded = true
      }, 0);
    }
  }
  return <TabContainer
    data={[
      {
        isActive: true,
        title: 'Main',
        component: Main,
        data: '',
      },
      {
        isActive: false,
        title: 'Generate Matches',
        component: GenerateMatches,
        data: '',
      }
    ]}
    switching={switching}
  />
}

ReactDOM.render(<App />, document.getElementById('container'))

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
