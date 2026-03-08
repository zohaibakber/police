"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TemplateRecord } from "./schema";

interface TemplateLibraryProps {
  templates: TemplateRecord[];
  selectedTemplateId: number | null;
  onSelectTemplate: (template: TemplateRecord) => void;
  onCreate: () => void;
  onEdit: (template: TemplateRecord) => void;
  onDelete: (template: TemplateRecord) => void;
}

export function TemplateLibrary({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onCreate,
  onEdit,
  onDelete,
}: TemplateLibraryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Template Library</CardTitle>
          <CardDescription>Reusable document templates.</CardDescription>
        </div>
        <Button onClick={onCreate}>Create Template</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Placeholders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No templates found. Start by creating one.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => {
                const selected = selectedTemplateId === template.id;

                return (
                  <TableRow
                    key={template.id}
                    data-state={selected ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>{template.placeholders.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(template);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(template);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
