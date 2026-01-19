"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { TemplateToolbar } from "./template-toolbar"

interface TemplateEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function TemplateEditor({
  content,
  onChange,
  placeholder = "Digite o conteudo do template...",
}: TemplateEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return (
      <div className="h-[300px] animate-pulse rounded-md border bg-muted" />
    )
  }

  return (
    <div className="rounded-md border">
      <TemplateToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
