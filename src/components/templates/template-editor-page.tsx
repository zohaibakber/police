"use client";

import * as React from "react";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  insertTemplateRecord,
  updateTemplateRecord,
  type TemplateInsert,
} from "@/lib/db";
import {
  COMMON_PLACEHOLDERS,
  extractPlaceholders,
  type TemplateRecord,
} from "./schema";

interface TemplateEditorPageProps {
  template: TemplateRecord | null;
}

export function TemplateEditorPage({ template }: TemplateEditorPageProps) {
  const navigate = useNavigate();
  const isEditing = template !== null;

  const [name, setName] = React.useState(template?.name ?? "");
  const [content, setContent] = React.useState(template?.content ?? "");
  const [saving, setSaving] = React.useState(false);

  const placeholders = React.useMemo(
    () => extractPlaceholders(content),
    [content],
  );

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor: activeEditor }) => {
      setContent(activeEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[calc(100vh-14rem)] px-4 py-3 outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:ps-6",
      },
    },
  });

  const insertPlaceholder = (token: string) => {
    editor?.chain().focus().insertContent(token).run();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const plainText = content.replace(/<[^>]*>/g, " ").trim();
    if (plainText.length < 10) {
      toast.error("Template content must be at least 10 characters");
      return;
    }

    setSaving(true);
    try {
      const extracted = extractPlaceholders(content);

      if (isEditing) {
        await updateTemplateRecord({
          id: template.id,
          name,
          content,
          placeholders: extracted,
          createdAt: template.createdAt,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Template updated successfully");
      } else {
        const insert: TemplateInsert = {
          name,
          content,
          placeholders: extracted,
        };
        await insertTemplateRecord(insert);
        toast.success("Template created successfully");
      }

      navigate({ to: "/templates" });
    } catch {
      toast.error(
        "Unable to save template in this environment. Use the Tauri desktop app for database writes.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/templates" })}
          aria-label="Back to templates"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name…"
          className="max-w-sm font-medium"
        />
        <div className="ms-auto flex items-center gap-2">
          {placeholders.length > 0 && (
            <div className="hidden items-center gap-1 md:flex">
              {placeholders.map((token) => (
                <Badge key={token} variant="outline" className="text-xs">
                  {`{{${token}}}`}
                </Badge>
              ))}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b px-4 py-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <BoldIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <ItalicIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <UnderlineIcon className="size-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button
          type="button"
          size="icon-sm"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <ListIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered List"
        >
          <ListOrderedIcon className="size-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button
          type="button"
          size="sm"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          Paragraph
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground">Placeholders:</span>
          {COMMON_PLACEHOLDERS.map((token) => (
            <Button
              key={token}
              type="button"
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => insertPlaceholder(token)}
            >
              {token}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
