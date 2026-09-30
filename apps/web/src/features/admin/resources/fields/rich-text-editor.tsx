'use client'

import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND, $isListNode } from '@lexical/list'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
} from 'lexical'
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Quote, Redo2, Underline, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

/**
 * Minimal Lexical editor whose JSON is compatible with Payload's `richText` (lexical) fields:
 * paragraphs, h2/h3, quotes, bullet/numbered lists and bold/italic/underline.
 */

type Block = 'paragraph' | 'h2' | 'h3' | 'quote' | 'bullet' | 'number'

const theme = {
  paragraph: 'mb-3 last:mb-0',
  heading: { h2: 'mt-5 mb-2 text-xl font-semibold first:mt-0', h3: 'mt-4 mb-2 text-lg font-semibold first:mt-0' },
  quote: 'border-l-2 pl-4 italic text-muted-foreground my-3',
  list: { ul: 'list-disc pl-6 my-3', ol: 'list-decimal pl-6 my-3', listitem: 'my-1' },
  text: { bold: 'font-semibold', italic: 'italic', underline: 'underline' },
}

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [block, setBlock] = useState<Block>('paragraph')
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const update = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setFormats({ bold: selection.hasFormat('bold'), italic: selection.hasFormat('italic'), underline: selection.hasFormat('underline') })
    const anchor = selection.anchor.getNode()
    const element = anchor.getKey() === 'root' ? anchor : anchor.getTopLevelElementOrThrow()
    if ($isListNode(element)) {
      const list = $getNearestNodeOfType(anchor, ListNode)
      setBlock((list ?? element).getListType() === 'number' ? 'number' : 'bullet')
    } else if ($isHeadingNode(element)) setBlock(element.getTag() === 'h3' ? 'h3' : 'h2')
    else if ($isQuoteNode(element)) setBlock('quote')
    else setBlock('paragraph')
  }, [])

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(update)),
        editor.registerCommand(SELECTION_CHANGE_COMMAND, () => (update(), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_UNDO_COMMAND, (value) => (setCanUndo(value), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_REDO_COMMAND, (value) => (setCanRedo(value), false), COMMAND_PRIORITY_LOW),
      ),
    [editor, update],
  )

  const setBlockType = (next: Block) => {
    if (next === 'bullet' || next === 'number') {
      editor.dispatchCommand(block === next ? REMOVE_LIST_COMMAND : next === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)
      return
    }
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () =>
        next === 'h2' || next === 'h3' ? $createHeadingNode(block === next ? 'h2' : next) : next === 'quote' ? $createQuoteNode() : $createParagraphNode(),
      )
    })
  }

  const blocks: [Block, React.ComponentType<{ className?: string }>, string][] = [
    ['paragraph', Pilcrow, 'Paragraph'],
    ['h2', Heading2, 'Heading 2'],
    ['h3', Heading3, 'Heading 3'],
    ['quote', Quote, 'Quote'],
    ['bullet', List, 'Bulleted list'],
    ['number', ListOrdered, 'Numbered list'],
  ]

  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-0.5 border-b p-1">
      {blocks.map(([value, Icon, label]) => (
        <Toggle key={value} size="sm" pressed={block === value} onPressedChange={() => setBlockType(value)} aria-label={label}>
          <Icon className="size-4" />
        </Toggle>
      ))}
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
      {(
        [
          ['bold', Bold],
          ['italic', Italic],
          ['underline', Underline],
        ] as const
      ).map(([format, Icon]) => (
        <Toggle key={format} size="sm" pressed={formats[format]} onPressedChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)} aria-label={format}>
          <Icon className="size-4" />
        </Toggle>
      ))}
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
      <Toggle size="sm" pressed={false} disabled={!canUndo} onPressedChange={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} aria-label="Undo">
        <Undo2 className="size-4" />
      </Toggle>
      <Toggle size="sm" pressed={false} disabled={!canRedo} onPressedChange={() => editor.dispatchCommand(REDO_COMMAND, undefined)} aria-label="Redo">
        <Redo2 className="size-4" />
      </Toggle>
    </div>
  )
}

function isSerializedState(value: unknown): value is { root: { children: unknown[] } } {
  return Boolean(value && typeof value === 'object' && 'root' in value && Array.isArray((value as { root: { children?: unknown } }).root?.children))
}

export function RichTextEditor({
  value,
  onChange,
  invalid,
  placeholder,
}: {
  value: unknown
  onChange: (value: unknown) => void
  invalid?: boolean
  placeholder?: string
}) {
  const initialConfig = {
    namespace: 'panel-rich-text',
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    editorState: isSerializedState(value) && value.root.children.length > 0 ? JSON.stringify(value) : undefined,
    onError: (error: Error) => {
      console.error('[rich-text]', error)
    },
  }

  const handleChange = (state: EditorState) => {
    const json = state.toJSON()
    const isEmpty = state.read(() => $getRoot().getTextContent().trim() === '')
    onChange(isEmpty ? null : json)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('bg-background overflow-hidden rounded-md border shadow-xs', invalid && 'border-destructive')}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={<ContentEditable className="min-h-40 px-3 py-2.5 text-sm leading-relaxed outline-none" aria-placeholder={placeholder ?? ''} placeholder={<div className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 text-sm">{placeholder}</div>} />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </div>
    </LexicalComposer>
  )
}
