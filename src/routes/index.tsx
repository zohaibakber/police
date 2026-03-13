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
import { deleteFirRecord, getFirRecords, seedFirDataIfEmpty } from "@/lib/db";
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
      toast.success("ایف آئی آر کامیابی سے حذف ہو گئی");
      setDeleteOpen(false);
      setFirToDelete(null);
      refetch();
    } catch {
      toast.error("ایف آئی آر حذف نہیں ہو سکی");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2 md:gap-6 md:p-4">
      <DataTable
        data={firData}
        searchPlaceholder="ایف آئی آر تلاش کریں..."
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
            <AlertDialogTitle>ایف آئی آر حذف کریں</AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی {firToDelete?.fir} کو حذف کرنا چاہتے ہیں؟ یہ عمل واپسی کے قابل نہیں۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ کریں</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              حذف کریں
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
