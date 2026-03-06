import { z } from "zod";

/**
 * FIR (First Information Report) document model
 * Translated from Urdu document schema:
 * - سیریل نمبر → Serial Number
 * - ایف آئی آر → FIR (First Information Report)
 * - مورخہ → Dated
 * - تھانہ → Police Station
 * - منیت امدی → Complainant's Name
 * - شناختی کارڈ → ID Card Number
 * - موبائیل نمبر → Mobile Number
 * - مرتبه و مرسله → Prepared and Dispatched by
 * - تحریر کننده → Writer / Author
 * - تاریخ وقوعہ → Date of Incident
 * - سٹیٹس → Status
 * - ایکشن → Action
 */
export const firSchema = z.object({
  id: z.number(),
  serialNumber: z.number(),
  fir: z.string(),
  dated: z.string(),
  policeStation: z.string(),
  complainantName: z.string(),
  idCardNumber: z.string(),
  mobileNumber: z.string(),
  preparedAndDispatchedBy: z.string(),
  writer: z.string(),
  dateOfIncident: z.string(),
  status: z.enum(["pending", "registered", "under_investigation", "closed"]),
});

export type FIR = z.infer<typeof firSchema>;
