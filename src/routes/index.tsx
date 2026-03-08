import * as React from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DataTable, type FIR } from "@/components/data-table";
import { useCommandAddFir } from "@/components/command-palette";
import { FirFormDialog } from "@/components/fir-form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import firDataJson from "@/app/dashboard/fir-data.json";
import {
  deleteFirRecord,
  getFirRecords,
  seedFirDataIfEmpty,
} from "@/lib/db";
import { yyyyMmDdToDdMmYyyy } from "@/lib/date-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      await seedFirDataIfEmpty();
      return await getFirRecords();
    } catch {
      const data = firDataJson as FIR[];
      return data.map((row) => ({
        ...row,
        dated: yyyyMmDdToDdMmYyyy(row.dated),
        dateOfIncident: yyyyMmDdToDdMmYyyy(row.dateOfIncident),
      }));
    }
  },
  component: Index,
});

function Index() {
  const router = useRouter();
  const firData = Route.useLoaderData();
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editingFir, setEditingFir] = React.useState<FIR | null>(null);
  const [firToDelete, setFirToDelete] = React.useState<FIR | null>(null);

  const refetch = () => router.invalidate();

  const handleAdd = () => {
    setEditingFir(null);
    setFormOpen(true);
  };

  useCommandAddFir(handleAdd);

  const handleEdit = (fir: FIR) => {
    setEditingFir(fir);
    setFormOpen(true);
  };

  const handleDeleteClick = (fir: FIR) => {
    setFirToDelete(fir);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!firToDelete) return;
    try {
      await deleteFirRecord(firToDelete.id);
      toast.success("FIR deleted successfully");
      setDeleteOpen(false);
      setFirToDelete(null);
      refetch();
    } catch {
      toast.error("Failed to delete FIR");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2 md:gap-6 md:p-4">
      <DataTable
        data={firData}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />
      <FirFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialFir={editingFir}
        onSuccess={refetch}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FIR</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {firToDelete?.fir}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
