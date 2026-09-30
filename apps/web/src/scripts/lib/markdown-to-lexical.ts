/**
 * Minimal Markdown → Lexical (Payload rich text) converter for seed content:
 * `## heading`, `### heading`, `- list item`, `1. list item`, blank-line separated paragraphs and `**bold**`.
 */

const block = { version: 1, direction: 'ltr', format: '', indent: 0 } as const

function textNodes(line: string) {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => {
      const bold = part.startsWith('**') && part.endsWith('**')
      return { type: 'text', version: 1, text: bold ? part.slice(2, -2) : part, format: bold ? 1 : 0, detail: 0, mode: 'normal', style: '' }
    })
}

export function markdownToLexical(markdown: string) {
  const children: unknown[] = []
  const lines = markdown.trim().split('\n')
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length) children.push({ ...block, type: 'paragraph', textFormat: 0, textStyle: '', children: textNodes(paragraph.join(' ')) })
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    children.push({
      ...block,
      type: 'list',
      listType: list.ordered ? 'number' : 'bullet',
      tag: list.ordered ? 'ol' : 'ul',
      start: 1,
      children: list.items.map((item, index) => ({ ...block, type: 'listitem', value: index + 1, children: textNodes(item) })),
    })
    list = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    const heading = /^(#{2,3})\s+(.*)$/.exec(line)
    const bullet = /^-\s+(.*)$/.exec(line)
    const numbered = /^\d+\.\s+(.*)$/.exec(line)
    if (!line) {
      flushParagraph()
      flushList()
    } else if (heading) {
      flushParagraph()
      flushList()
      children.push({ ...block, type: 'heading', tag: heading[1] === '##' ? 'h2' : 'h3', children: textNodes(heading[2]!) })
    } else if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      if (list && list.ordered !== ordered) flushList()
      list ??= { ordered, items: [] }
      list.items.push((bullet ?? numbered)![1]!)
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return { root: { ...block, type: 'root', children } }
}
