export default {
  inputFiles: [
    '*.bundle.js',
    'index.bundle.css',
    'index.ejs.html'
  ],
  excludeFiles: [
    'service-worker.bundle.js',
    'worker.bundle.js'
  ],
  outputFiles: (file: string) => file.replace('.ejs', ''),
  inlinedFiles: [
    'index.bundle.js',
    'index.bundle.css'
  ],
  json: false,
  ejsOptions: {
    rmWhitespace: true
  },
  sha: 256,
  customNewFileName: (_filePath: string, _fileString: string, md5String: string, baseName: string, extensionName: string) => baseName + '-' + md5String + extensionName,
  fileSize: 'file-size.json',
  context: {
    buildMoment: new Date().toString()
  }
}
