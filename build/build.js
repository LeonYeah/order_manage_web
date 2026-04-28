const webpack = require('webpack')
const fs = require('fs')
const path = require('path')
const webpackConfig = require('./webpack.prod.conf')

const distDir = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  fs.readdirSync(distDir).forEach(file => {
    if (/^app\..*\.js(\.map)?$/.test(file) || file === 'index.html') {
      fs.rmSync(path.join(distDir, file), { force: true })
    }
  })
}

webpack(webpackConfig, (err, stats) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }

  const info = stats.toJson()
  if (stats.hasErrors()) {
    // eslint-disable-next-line no-console
    console.error(info.errors)
    process.exit(1)
  }

  if (stats.hasWarnings()) {
    // eslint-disable-next-line no-console
    console.warn(info.warnings)
  }

  // eslint-disable-next-line no-console
  console.log(stats.toString({ colors: true, modules: false }))
})
