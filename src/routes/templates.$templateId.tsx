import { createFileRoute } from "@tanstack/react-router";
import { TemplateEditorPage } from "@/components/templates/template-editor-page";
import { getTemplateRecordById } from "@/lib/db";
import templateDataJson from "@/app/dashboard/template-data.json";
import type { TemplateRecord } from "@/components/templates/schema";

export const Route = createFileRoute("/templates/$templateId")({
  loader: async ({ params }) => {
    const id = Number(params.templateId);
    try {
      const template = await getTemplateRecordById(id);
      if (!template) throw new Error("Not found");
      return template;
    } catch {
      const fallback = (templateDataJson as TemplateRecord[]).find(
        (t) => t.id === id,
      );
      if (!fallback) throw new Error("Template not found");
      return fallback;
    }
  },
  component: EditTemplate,
});

function EditTemplate() {
  const template = Route.useLoaderData();
  return <TemplateEditorPage template={template} />;
}
