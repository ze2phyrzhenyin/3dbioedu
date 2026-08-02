import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const sourceRoot = path.resolve('src')
const translationPath = path.join(sourceRoot, 'data', 'englishTranslations.ts')
const sourceFiles = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(entryPath)
    else if (/\.tsx?$/.test(entry.name) && entryPath !== translationPath) {
      sourceFiles.push(entryPath)
    }
  }
}

function readSource(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
}

function propertyName(node) {
  if (ts.isIdentifier(node)) return node.text
  if (ts.isStringLiteral(node)) return node.text
  return null
}

walk(sourceRoot)

const frenchSource = new Set()
for (const filePath of sourceFiles) {
  const source = readSource(filePath)
  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === 'fr' &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      frenchSource.add(node.initializer.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

const englishKeys = new Set()
const translationSource = readSource(translationPath)
function collectEnglishKeys(node) {
  if (ts.isPropertyAssignment(node)) {
    const name = propertyName(node.name)
    if (name) englishKeys.add(name)
  }
  ts.forEachChild(node, collectEnglishKeys)
}
collectEnglishKeys(translationSource)

const missing = [...frenchSource].filter((source) => !englishKeys.has(source))
if (missing.length > 0) {
  console.error('Missing English translations:')
  for (const source of missing) console.error(`- ${source}`)
  process.exitCode = 1
} else {
  console.log(`English translation coverage: ${frenchSource.size}/${frenchSource.size}`)
}
