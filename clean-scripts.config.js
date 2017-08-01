module.exports = {
  build: [
    `rimraf index.bundle-*.js vendor.bundle-*.js index.bundle-*.css`,
    `types-as-schema types.ts --json .`,
    `file2variable-cli *.template.html *-schema.json -o variables.ts --html-minify --json`,
    `tsc`,
    `cleancss index.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tab-container-component/tab-container.min.css -o index.bundle.css`,
    `webpack --display-modules`,
    `rev-static`,
    `sw-precache --config sw-precache.config.js`,
    `uglifyjs service-worker.js -o service-worker.bundle.js`
  ],
  lint: [
    `tslint "*.ts"`,
    `standard "**/*.config.js"`
  ],
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: [
    `standard --fix "**/*.config.js"`
  ]
}
