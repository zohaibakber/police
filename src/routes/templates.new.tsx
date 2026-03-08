import { createFileRoute } from "@tanstack/react-router";
import { TemplateEditorPage } from "@/components/templates/template-editor-page";

export const Route = createFileRoute("/templates/new")({
  component: () => <TemplateEditorPage template={null} />,
});
