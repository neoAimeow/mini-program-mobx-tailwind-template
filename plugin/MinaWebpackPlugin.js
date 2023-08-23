const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const path = require('path')
const fs = require('fs')
const replaceExt = require('replace-ext')
// const { entries: aliasEntries } = require('../alias')
const assetsChunkName = '__assets_chunk_name__'

function _inflateEntries(entries = [], dirname, entry) {
  const configFile = replaceExt(entry, '.json')
  const content = fs.readFileSync(configFile, 'utf8')
  const config = JSON.parse(content)

  const { pages, usingComponents, subpackages } = config
  pages && pages.forEach(item => inflateEntries(entries, dirname, item))
  usingComponents && Object.values(usingComponents).forEach(item => inflateEntries(entries, dirname, item))
  subpackages &&
    subpackages.forEach(subpackage =>
      subpackage.pages.forEach(item => inflateEntries(entries, dirname + `/${subpackage.root}`, item)),
    )
}

function inflateEntries(entries, dirname, entry) {
  if (/plugin:\/\//.test(entry)) {
    console.log(`发现插件 ${entry}`)
    return
  }

  if (typeof entry === 'object') {
    entry = entry.main.import[0]
  }

  if (typeof entry !== 'string') {
    throw new Error('入口文件位置获取有误，请检查webpack版本或webpack配置(webpack.config.js)是否发生变化')
  }

  //通过useExtendedLib扩展库的方式引入WeUI组件https://developers.weixin.qq.com/miniprogram/dev/extended/weui/quickstart.html
  //扩展库内置于开发者工具中，此处无需处理
  //WeUI组件路径包含weui-miniprogram，据此进行判断
  if (entry.includes('@vant/weapp')) return

  // for (let i = 0; i < aliasEntries.length; i++) {
  //   const alias = aliasEntries[i];
  //   if (entry.startsWith(alias.find)) {
  //     entry = entry.replace(alias.find, alias.replacement)
  //   }
  // }
  entry = path.resolve(dirname, entry)
  if (entry != null && !entries.includes(entry)) {
    entries.push(entry)
    _inflateEntries(entries, path.dirname(entry), entry)
  }
}

function first(entry, extensions) {
  for (const ext of extensions) {
    const file = replaceExt(entry, ext)
    if (fs.existsSync(file)) {
      return file
    }
  }
  return null
}

function all(entry, extensions) {
  const items = []
  for (const ext of extensions) {
    const file = replaceExt(entry, ext)
    if (fs.existsSync(file)) {
      items.push(file)
    }
  }
  return items
}

class MinaWebpackPlugin {
  constructor(options = {}) {
    this.scriptExtensions = options.scriptExtensions || ['.ts', '.js']
    this.assetExtensions = options.assetExtensions || []
    this.entries = []
  }

  applyEntry(compiler, done) {
    const { context } = compiler.options

    this.entries
      .map(item => first(item, this.scriptExtensions))
      .map(item => path.relative(context, item))
      .forEach(item => new SingleEntryPlugin(context, './' + item, replaceExt(item, '')).apply(compiler))

    this.entries
      .reduce((items, item) => [...items, ...all(item, this.assetExtensions)], [])
      .map(item => './' + path.relative(context, item))
      .forEach(item => new SingleEntryPlugin(context, item, item + assetsChunkName).apply(compiler))

    if (done) {
      done()
    }
  }

  apply(compiler) {
    const { context, entry } = compiler.options
    inflateEntries(this.entries, context, entry)

    compiler.hooks.entryOption.tap('MinaWebpackPlugin', () => {
      this.applyEntry(compiler)
      return true
    })

    compiler.hooks.watchRun.tap('MinaWebpackPlugin', (_compiler, done) => {
      this.applyEntry(_compiler, done)
    })
    compiler.hooks.compilation.tap('MinaWebpackPlugin', compilation => {
      compilation.hooks.beforeChunkAssets.tap('MinaWebpackPlugin', () => {
        compilation.chunks.forEach(chunk => {
          if (chunk.name.includes(assetsChunkName)) {
            compilation.chunks.delete(chunk)
          }
        })
      })
    })
  }
}

module.exports = MinaWebpackPlugin
