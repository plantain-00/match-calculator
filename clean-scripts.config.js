const childProcess = require('child_process')

module.exports = {
  build: [
    {
      version: [
        {
          js: [
            `types-as-schema types.ts --json .`,
            `file2variable-cli *.template.html *-schema.json -o variables.ts --html-minify --json`,
            `tsc`,
            `webpack --display-modules`
          ],
          css: [
            `lessc index.less > index.css`,
            `cleancss index.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tab-container-component/tab-container.min.css -o index.bundle.css`
          ],
          clean: `rimraf index.bundle-*.js vendor.bundle-*.js index.bundle-*.css`
        },
        `rev-static`
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
    `sw-precache --config sw-precache.config.js`,
    `uglifyjs service-worker.js -o service-worker.bundle.js`
  ],
  lint: {
    ts: `tslint "*.ts"`,
    js: `standard "**/*.config.js"`,
    less: `stylelint "*.less"`,
    export: `no-unused-export "*.ts"`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    () => new Promise((resolve, reject) => {
      childProcess.exec('git status -s', (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          if (stdout) {
            reject(new Error(`generated files doesn't match.`))
          } else {
            resolve()
          }
        }
      }).stdout.pipe(process.stdout)
    })
  ],
  fix: {
    ts: `tslint --fix "*.ts"`,
    js: `standard --fix "**/*.config.js"`,
    less: `stylelint --fix "/*.less"`
  },
  watch: `watch-then-execute "*.ts" "*.less" "*.template.html" --exclude "variables.ts" --script "npm run build"`
}
