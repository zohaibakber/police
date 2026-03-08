"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  insertTemplateRecord,
  updateTemplateRecord,
  type TemplateInsert,
} from "@/lib/db";
import { extractPlaceholders, type TemplateRecord } from "./schema";
import { TemplateForm } from "./template-form";
import type { TemplateFormValues } from "./template-form-schema";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate: TemplateRecord | null;
  onSuccess: () => void;
}

function templateToFormValues(template: TemplateRecord): TemplateFormValues {
  return {
    id: template.id,
    name: template.name,
    content: template.content,
  };
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  initialTemplate,
  onSuccess,
}: TemplateFormDialogProps) {
  const [defaultValues, setDefaultValues] =
    React.useState<TemplateFormValues | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initialTemplate) {
        setDefaultValues(templateToFormValues(initialTemplate));
      } else {
        setDefaultValues({
          id: 0,
          name: "",
          content: "",
        });
      }
    } else {
      setDefaultValues(null);
    }
  }, [open, initialTemplate]);

  const handleSubmit = async (value: TemplateFormValues) => {
    const placeholders = extractPlaceholders(value.content);

    if (value.id) {
      await updateTemplateRecord({
        id: value.id,
        name: value.name,
        content: value.content,
        placeholders,
        createdAt: initialTemplate?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const insert: TemplateInsert = {
      name: value.name,
      content: value.content,
      placeholders,
    };

    await insertTemplateRecord(insert);
  };

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialTemplate ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            Build a reusable DOCX template with placeholders for FIR data.
          </DialogDescription>
        </DialogHeader>
        {defaultValues && (
          <TemplateForm
            key={defaultValues.id ? `edit-${defaultValues.id}` : "new"}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
