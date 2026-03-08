import { z } from "zod";

export const templateFormSchema = z
  .object({
    id: z.number(),
    name: z.string().min(2, "Template name is required"),
    content: z.string(),
  })
  .superRefine((value, ctx) => {
    const plainText = value.content.replace(/<[^>]*>/g, " ").trim();
    if (plainText.length < 10) {
      ctx.addIssue({
        path: ["content"],
        code: "custom",
        message: "Template content must be at least 10 characters",
      });
    }
  });

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
