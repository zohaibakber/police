"use client";

import * as React from "react";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface VisualTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderTokens: readonly string[];
}

export function VisualTemplateEditor({
  value,
  onChange,
  placeholderTokens,
}: VisualTemplateEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-56 rounded-lg border bg-background px-3 py-2 text-sm outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:ps-6",
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const insertPlaceholder = (token: string) => {
    editor.chain().focus().insertContent(token).run();
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-sm">Template Body Editor</CardTitle>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <BoldIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <ItalicIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
          >
            <UnderlineIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
          >
            <ListIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered List"
          >
            <ListOrderedIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            Paragraph
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <EditorContent editor={editor} />
        <div className="flex flex-wrap gap-1">
          {placeholderTokens.map((token) => (
            <Button
              key={token}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => insertPlaceholder(token)}
            >
              {token}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
