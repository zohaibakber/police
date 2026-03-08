import { z } from "zod";
import { isDdMmYyyy } from "@/lib/date-utils";

export const firFormSchema = z.object({
  id: z.number(),
  serialNumber: z.number().min(1, "Serial number must be at least 1"),
  fir: z.string().min(1, "FIR is required"),
  dated: z.string().min(1, "Date is required").refine(isDdMmYyyy, "Use dd-mm-yyyy format"),
  policeStation: z.string().min(1, "Police station is required"),
  complainantName: z.string().min(1, "Complainant name is required"),
  idCardNumber: z.string().min(1, "ID card number is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  preparedAndDispatchedBy: z.string().min(1, "Prepared and dispatched by is required"),
  writer: z.string().min(1, "Writer is required"),
  dateOfIncident: z.string().min(1, "Date of incident is required").refine(isDdMmYyyy, "Use dd-mm-yyyy format"),
  status: z.enum(["pending", "registered", "under_investigation", "closed"]),
});

export type FirFormValues = z.infer<typeof firFormSchema>;

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "registered", label: "Registered" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "closed", label: "Closed" },
] as const;
