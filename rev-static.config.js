module.exports = {
  inputFiles: [
    '*.bundle.js',
    'index.bundle.css',
    'index.ejs.html'
  ],
  excludeFiles: [
    'service-worker.bundle.js',
    'worker.bundle.js'
  ],
  outputFiles: file => file.replace('.ejs', ''),
  inlinedFiles: [
    'index.bundle.js',
    'index.bundle.css'
  ],
  json: false,
  ejsOptions: {
    rmWhitespace: true
  },
  sha: 256,
  customNewFileName: (filePath, fileString, md5String, baseName, extensionName) => baseName + '-' + md5String + extensionName,
  fileSize: 'file-size.json'
}
