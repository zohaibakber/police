"use client";

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertTemplateRecord, updateTemplateRecord, type TemplateInsert } from "@/lib/db";
import { COMMON_PLACEHOLDERS, extractPlaceholders, type TemplateRecord } from "./schema";
import { VisualTemplateEditor } from "./slate-template-editor";

interface TemplateEditorPageProps {
  template: TemplateRecord | null;
}

export function TemplateEditorPage({ template }: TemplateEditorPageProps) {
  const navigate = useNavigate();
  const isEditing = template !== null;

  const [name, setName] = React.useState(template?.name ?? "");
  const [content, setContent] = React.useState(template?.content ?? "");
  const [saving, setSaving] = React.useState(false);

  const placeholders = React.useMemo(() => extractPlaceholders(content), [content]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
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
      <div className="flex min-h-0 flex-1 flex-col bg-background p-4">
        <VisualTemplateEditor
          value={content}
          onChange={setContent}
          placeholderTokens={COMMON_PLACEHOLDERS}
        />
      </div>
    </div>
  );
}
