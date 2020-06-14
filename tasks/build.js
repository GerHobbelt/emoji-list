const _arrayFlatPolyfill = require('array-flat-polyfill')
const chunk = require('lodash/chunk')

const _writeFile = require('./helpers/writeFile')
const by = require('./helpers/sortBy')
const toArray = require('./helpers/toArray')

const categories = require('../categories.json')
const emojisJSON = require('../emojis.json')

const toSlug = string => string.toLowerCase().replace(/\s+/g, '-')
const categoryGroups = categories.map(({groups}) => groups).flat()

// emojis may have multiple aliases
// split these aliases into individual emoji objects
const expandAliases = emojis => emojis.reduce((list, emoji) => {
  const aliases = toArray(emoji.alias)
  aliases.forEach(alias => list.push({ ...emoji, alias}))
  return list
}, [])

const categoryOrder = ({category: categoryA}, {category: categoryB}) => {
  const indexA = categoryGroups.indexOf(categoryA)
  const indexB = categoryGroups.indexOf(categoryB)

  if (indexA > indexB) return 1
  if (indexA < indexB) return -1
  return 0
}

function formatEmojisAsMarkdown (_emojis) {
  const emojis = expandAliases(_emojis)

  // build out each section
  const markdownTables = categories
    .map(({header, groups}) => {
      const emojisInSection = emojis.filter(({category}) => groups.includes(category))

      const codes = emojisInSection
        .sort(by(categoryOrder, 'unicode', 'alias'))
        .map(({alias}) => `:${alias}: \`:${alias}:\``)

      const rows = chunk(codes, 3)
        .map(([first, second, third]) => (
        `| ${first} | ${second || ''} | ${third || ''} |`
        ))
        .join('\n')

      return `
## ${header}

| emoji \`markdown\` | emoji \`markdown\` | emoji \`markdown\` |
|--- |--- |--- |
${rows}
`
    })
    .join('\n')


  const tableOfContents = categories
    .map(({header}) => `- [${header}](#${toSlug(header)})\n`)
    .join('')

  return `A list of GitHub emoji markup, adapted from rxavier's _[Complete list of github markdown emoji markup](https://gist.github.com/rxaviers/7360908)_, generated with a Grunt script for maintainability ([see repository](https://github.com/ricealexander/emoji-list)).

Additional original source material: http://unicode.org/emoji/charts/full-emoji-list.html

This table is available as a gist at https://gist.github.com/GerHobbelt/b9b87a2257ddd5251a45628d61385717 and as part of the build repo at https://github.com/GerHobbelt/emoji-list/blob/master/dist/emoji-list.md


# Table of Contents

${tableOfContents}
${markdownTables}`
}


module.exports = grunt => {
  const writeFile = _writeFile(grunt)

  grunt.registerTask('build', 'Generate Emoji List Markdown File', () => {
    const markdown = formatEmojisAsMarkdown(emojisJSON)
    writeFile('dist/emoji-list.md', markdown)
  })
}
