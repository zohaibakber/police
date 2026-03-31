"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { insertFirRecord, updateFirRecord, type FirInsert } from "@/lib/db";
import type { FIR } from "@/components/data-table/schema";
import { FirForm } from "./fir-form";
import type { FirFormValues } from "./fir-form-schema";

interface FirFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFir: FIR | null;
  onSuccess: () => void;
}

function firToFormValues(fir: FIR): FirFormValues {
  return {
    fir: fir.fir,
    dated: fir.dated,
    policeStation: fir.policeStation,
    complainantName: fir.complainantName,
    idCardNumber: fir.idCardNumber,
    mobileNumber: fir.mobileNumber,
    preparedAndDispatchedBy: fir.preparedAndDispatchedBy,
    writer: fir.writer,
    dateOfIncident: fir.dateOfIncident,
    status: fir.status,
  };
}

export function FirFormDialog({ open, onOpenChange, initialFir, onSuccess }: FirFormDialogProps) {
  const [defaultValues, setDefaultValues] = React.useState<FirFormValues | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initialFir) {
        setDefaultValues(firToFormValues(initialFir));
      } else {
        setDefaultValues({
          fir: "",
          dated: "",
          policeStation: "",
          complainantName: "",
          idCardNumber: "",
          mobileNumber: "",
          preparedAndDispatchedBy: "",
          writer: "",
          dateOfIncident: "",
          status: "pending",
        });
      }
    } else {
      setDefaultValues(null);
    }
  }, [open, initialFir]);

  const handleSubmit = async (value: FirFormValues) => {
    if (initialFir) {
      await updateFirRecord({
        ...initialFir,
        ...value,
      });
    } else {
      const insert: FirInsert = value;
      await insertFirRecord(insert);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initialFir ? "ایف آئی آر میں ترمیم" : "نئی ایف آئی آر"}</DialogTitle>
          <DialogDescription>
            {initialFir
              ? "ایف آئی آر کی تفصیلات میں ضروری ترمیم کریں۔"
              : "نئی ایف آئی آر کی تفصیلات درج کریں۔"}
          </DialogDescription>
        </DialogHeader>
        {defaultValues && (
          <FirForm
            key={initialFir ? `edit-${initialFir.id}` : "new"}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isEdit={!!initialFir}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
