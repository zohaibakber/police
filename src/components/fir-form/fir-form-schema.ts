import { z } from "zod";

export const firFormSchema = z.object({
  fir: z.string().min(1, "FIR is required"),
  dated: z.string().min(1, "Date is required"),
  policeStation: z.string().min(1, "Police station is required"),
  complainantName: z.string().min(1, "Complainant name is required"),
  idCardNumber: z.string().min(1, "ID card number is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  preparedAndDispatchedBy: z.string().min(1, "Prepared and dispatched by is required"),
  writer: z.string().min(1, "Writer is required"),
  dateOfIncident: z.string().min(1, "Date of incident is required"),
  status: z.enum(["pending", "registered", "under_investigation", "closed"]),
});

export type FirFormValues = z.infer<typeof firFormSchema>;

export const STATUS_OPTIONS = [
  { value: "pending", label: "زیر التواء" },
  { value: "registered", label: "رجسٹرڈ" },
  { value: "under_investigation", label: "زیر تفتیش" },
  { value: "closed", label: "نمٹا دیا گیا" },
] as const;
