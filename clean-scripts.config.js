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
    [
      `sw-precache --config sw-precache.config.js`,
      `uglifyjs service-worker.js -o service-worker.bundle.js`
    ],
    async () => {
      const { createServer } = require('http-server')
      const puppeteer = require('puppeteer')
      const server = createServer()
      server.listen(8000)
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.goto(`http://localhost:8000`)
      await page.waitFor(2000)
      await page.screenshot({ path: `screenshot.png`, fullPage: true })
      server.close()
      browser.close()
    }
  ],
  lint: {
    ts: `tslint "*.ts"`,
    js: `standard "**/*.config.js"`,
    less: `stylelint "*.less"`,
    export: `no-unused-export "*.ts"`
  },
  test: [
    'tsc -p spec',
    process.env.APPVEYOR ? 'echo "skip karma test"' : 'karma start spec/karma.config.js',
    'git checkout screenshot.png',
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
  watch: {
    schema: `watch-then-execute "types.ts" --script "clean-scripts build[0].version[0].js[0]"`,
    template: `file2variable-cli *.template.html *-schema.json -o variables.ts --html-minify --json --watch`,
    src: `tsc --watch`,
    webpack: `webpack --watch`,
    less: `watch-then-execute "index.less" --script "clean-scripts build[0].version[0].css"`,
    rev: `rev-static --watch`,
    sw: `watch-then-execute "vendor.bundle-*.js" "index.html" "worker.bundle.js" --script "clean-scripts build[1]"`
  },
  prerender: [
    async () => {
      const { createServer } = require('http-server')
      const puppeteer = require('puppeteer')
      const fs = require('fs')
      const server = createServer()
      server.listen(8000)
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.waitFor(1000)
      await page.goto('http://localhost:8000')
      await page.waitFor(2000)
      const content = await page.evaluate(() => {
        const element = document.querySelector('#prerender-container')
        return element ? element.innerHTML : ''
      })
      fs.writeFileSync('prerender.html', content)
      server.close()
      browser.close()
    },
    `clean-scripts build[0].version[1]`,
    `clean-scripts build[1]`
  ]
}
