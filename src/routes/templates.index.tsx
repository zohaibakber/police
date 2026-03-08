import * as React from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { TemplateLibrary, type TemplateRecord } from "@/components/templates";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deleteTemplateRecord,
  getTemplateRecords,
  seedTemplateDataIfEmpty,
} from "@/lib/db";
import templateDataJson from "@/app/dashboard/template-data.json";
import { toast } from "sonner";

export const Route = createFileRoute("/templates/")({
  loader: async () => {
    try {
      await seedTemplateDataIfEmpty();
      return await getTemplateRecords();
    } catch {
      return templateDataJson as TemplateRecord[];
    }
  },
  component: TemplatesIndex,
});

function TemplatesIndex() {
  const router = useRouter();
  const navigate = useNavigate();
  const templates = Route.useLoaderData();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] =
    React.useState<TemplateRecord | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    number | null
  >(templates[0]?.id ?? null);

  React.useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId(null);
      return;
    }

    const hasSelected = templates.some(
      (template) => template.id === selectedTemplateId,
    );
    if (!hasSelected) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = React.useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const handleAdd = () => {
    navigate({ to: "/templates/new" });
  };

  const handleEdit = (template: TemplateRecord) => {
    navigate({
      to: "/templates/$templateId",
      params: { templateId: String(template.id) },
    });
  };

  const handleDelete = (template: TemplateRecord) => {
    setTemplateToDelete(template);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplateRecord(templateToDelete.id);
      toast.success("Template deleted successfully");
      setDeleteOpen(false);
      setTemplateToDelete(null);
      router.invalidate();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="grid gap-4 p-2 md:gap-6 md:p-4 xl:grid-cols-[1.2fr_0.8fr]">
      <TemplateLibrary
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={(template) => setSelectedTemplateId(template.id)}
        onCreate={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Template Preview</CardTitle>
          <CardDescription>
            Visual preview of the selected template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTemplate ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <h3 className="font-medium">{selectedTemplate.name}</h3>
                <div
                  className="template-rich-content mt-2 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: selectedTemplate.content || "<p>No content yet</p>",
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.placeholders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No placeholders detected yet.
                  </p>
                ) : (
                  selectedTemplate.placeholders.map((token) => (
                    <Badge key={token} variant="outline">
                      {`{{${token}}}`}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a template from the list to preview details.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {templateToDelete?.name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
