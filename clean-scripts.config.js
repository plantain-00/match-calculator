const { Service, checkGitStatus, executeScriptAsync } = require('clean-scripts')
const { watch } = require('watch-then-execute')

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts" "prerender/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`
const lessFiles = `"*.less"`

const schemaCommand = `types-as-schema types.ts --json .`
const templateCommand = `file2variable-cli --config file2variable.config.js`
const tscCommand = `tsc`
const webpackCommand = `webpack`
const revStaticCommand = `rev-static`
const cssCommand = [
  `lessc index.less > index.css`,
  `postcss index.css -o index.postcss.css`,
  `cleancss index.postcss.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tab-container-component/dist/tab-container.min.css -o index.bundle.css`
]
const swCommand = [
  `sw-precache --config sw-precache.config.js`,
  `uglifyjs service-worker.js -o service-worker.bundle.js`
]

module.exports = {
  build: [
    {
      version: [
        {
          js: [
            schemaCommand,
            templateCommand,
            tscCommand,
            webpackCommand
          ],
          css: cssCommand,
          clean: `rimraf index.bundle-*.js vendor.bundle-*.js index.bundle-*.css`
        },
        revStaticCommand
      ],
      copy: [
        `cpy node_modules/monaco-editor/min/vs/loader.js vs/`,
        `cpy node_modules/monaco-editor/min/vs/language/json/jsonMode.js vs/language/json/`,
        `cpy node_modules/monaco-editor/min/vs/language/json/jsonWorker.js vs/language/json/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.js vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.css vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/editor/editor.main.nls.js vs/editor/`,
        `cpy node_modules/monaco-editor/min/vs/base/worker/workerMain.js vs/base/worker/`
      ]
    },
    swCommand
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    less: `stylelint ${lessFiles}`,
    export: `no-unused-export ${tsFiles} ${lessFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    () => checkGitStatus()
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`,
    less: `stylelint --fix ${lessFiles}`
  },
  watch: {
    schema: `${schemaCommand} --watch`,
    template: `${templateCommand} --watch`,
    src: `${tscCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    less: () => watch(['*.less'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`,
    sw: () => watch(['vendor.bundle-*.js', 'index.html', 'worker.bundle.js'], [], () => executeScriptAsync(swCommand))
  },
  screenshot: [
    new Service(`http-server -p 8000`),
    `tsc -p screenshots`,
    `node screenshots/index.js`
  ],
  prerender: [
    new Service(`http-server -p 8000`),
    `tsc -p prerender`,
    `node prerender/index.js`,
    revStaticCommand,
    swCommand
  ]
}
