type LexicalNode = { text?: string; children?: LexicalNode[] }

/** Plain text of a Lexical document (structured data, meta descriptions); one line per block. */
export function lexicalToText(value: unknown): string {
  const root = (value as { root?: LexicalNode } | null)?.root
  const walk = (node: LexicalNode): string => node.text ?? (node.children ?? []).map(walk).join('')
  return (root?.children ?? []).map(walk).join('\n').trim()
}
