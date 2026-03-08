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
  insertFirRecord,
  updateFirRecord,
  type FirInsert,
} from "@/lib/db";
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
    id: fir.id,
    serialNumber: fir.serialNumber,
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

export function FirFormDialog({
  open,
  onOpenChange,
  initialFir,
  onSuccess,
}: FirFormDialogProps) {
  const [defaultValues, setDefaultValues] =
    React.useState<FirFormValues | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initialFir) {
        setDefaultValues(firToFormValues(initialFir));
      } else {
        setDefaultValues({
          id: 0,
          serialNumber: 0,
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
    if (value.id) {
      await updateFirRecord(value as FIR);
    } else {
      const insert: FirInsert = {
        fir: value.fir,
        dated: value.dated,
        policeStation: value.policeStation,
        complainantName: value.complainantName,
        idCardNumber: value.idCardNumber,
        mobileNumber: value.mobileNumber,
        preparedAndDispatchedBy: value.preparedAndDispatchedBy,
        writer: value.writer,
        dateOfIncident: value.dateOfIncident,
        status: value.status,
      };
      await insertFirRecord(insert);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialFir ? "Edit FIR" : "Add FIR"}</DialogTitle>
          <DialogDescription>
            {initialFir
              ? "Update the First Information Report details."
              : "Create a new First Information Report."}
          </DialogDescription>
        </DialogHeader>
        {defaultValues && (
          <FirForm
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
