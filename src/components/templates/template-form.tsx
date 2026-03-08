"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { COMMON_PLACEHOLDERS, extractPlaceholders } from "./schema";
import { VisualTemplateEditor } from "./visual-template-editor";
import {
  templateFormSchema,
  type TemplateFormValues,
} from "./template-form-schema";

interface TemplateFormProps {
  defaultValues: TemplateFormValues;
  onSubmit: (value: TemplateFormValues) => Promise<void>;
  onSuccess?: () => void;
}

export function TemplateForm({
  defaultValues,
  onSubmit,
  onSuccess,
}: TemplateFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: templateFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
        toast.success(
          value.id
            ? "Template updated successfully"
            : "Template created successfully",
        );
        onSuccess?.();
      } catch {
        toast.error(
          "Unable to save template in this environment. Use the Tauri desktop app for database writes.",
        );
      }
    },
  });

  return (
    <form
      id="template-form"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="grid grid-cols-1 gap-4">
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Template Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Court Notice Template"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const placeholders = extractPlaceholders(field.state.value);

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Template Body</FieldLabel>
                <VisualTemplateEditor
                  value={field.state.value}
                  onChange={field.handleChange}
                  placeholderTokens={COMMON_PLACEHOLDERS}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {placeholders.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No placeholders detected yet.
                    </span>
                  ) : (
                    placeholders.map((token) => (
                      <Badge key={token} variant="outline">
                        {`{{${token}}}`}
                      </Badge>
                    ))
                  )}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>

      <div className="mt-4 flex justify-end">
        <Button type="submit" form="template-form">
          {defaultValues.id ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
