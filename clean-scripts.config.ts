import { executeScriptAsync } from 'clean-scripts'
import { watch } from 'watch-then-execute'

const tsFiles = `"*.ts"`
const jsFiles = `"*.config.js"`
const lessFiles = `"*.less"`

const isDev = process.env.NODE_ENV === 'development'

const schemaCommand = isDev ? undefined : `types-as-schema types.ts --json .`
const templateCommand = `file2variable-cli --config file2variable.config.ts`
const webpackCommand = `webpack --config webpack.config.ts`
const revStaticCommand = `rev-static`
const cssCommand = [
  `lessc index.less > index.css`,
  `postcss index.css -o index.postcss.css`,
  `cleancss ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tab-container-component/dist/tab-container.min.css index.postcss.css -o index.bundle.css`
]
const swCommand = isDev ? undefined : [
  `sw-precache --config sw-precache.config.js`,
  `uglifyjs service-worker.js -o service-worker.bundle.js`
]

export default {
  build: [
    {
      version: [
        {
          js: [
            schemaCommand,
            templateCommand,
            webpackCommand
          ],
          css: cssCommand,
          clean: `rimraf index.bundle-*.js vendor.bundle-*.js index.bundle-*.css`
        },
        revStaticCommand
      ],
      copy: isDev ? undefined : [
        `cpy node_modules/monaco-editor/min/vs/loader.js vs/`,
        `cpy node_modules/monaco-editor/min/vs/language/typescript/tsMode.js vs/language/typescript/`,
        `cpy node_modules/monaco-editor/min/vs/language/typescript/tsWorker.js vs/language/typescript/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.js vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.css vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.nls.js vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/base/worker/workerMain.js vs/base/worker/`,
        `cpy node_modules/monaco-editor/min/vs/basic-languages/typescript/typescript.js vs/basic-languages/typescript/`,
        `cpy node_modules/monaco-editor/min/vs/basic-languages/javascript/javascript.js vs/basic-languages/javascript/`
      ]
    },
    swCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    less: `stylelint ${lessFiles}`,
    export: `no-unused-export index.ts worker.ts ${lessFiles} --strict`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p . --strict --ignore-catch --ignore-files "variables.ts"'
  },
  test: [],
  fix: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`,
    less: `stylelint --fix ${lessFiles}`
  },
  watch: {
    template: `${templateCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    less: () => watch(['*.less'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`
  }
}
