import { z } from "zod";

export const templateSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  placeholders: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TemplateRecord = z.infer<typeof templateSchema>;

export const COMMON_PLACEHOLDERS = [
  "{{fir}}",
  "{{dated}}",
  "{{policeStation}}",
  "{{complainantName}}",
  "{{idCardNumber}}",
  "{{mobileNumber}}",
  "{{writer}}",
  "{{dateOfIncident}}",
  "{{status}}",
] as const;

const PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

export function extractPlaceholders(content: string): string[] {
  const tokens = new Set<string>();

  for (const match of content.matchAll(PLACEHOLDER_REGEX)) {
    if (match[1]) {
      tokens.add(match[1]);
    }
  }

  return Array.from(tokens.values());
}
