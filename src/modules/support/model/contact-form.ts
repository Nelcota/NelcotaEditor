import { z } from "zod";
import { messageBodySchema } from "#/modules/support/model/support-ticket";

/** Named like a real field, so a bot fills it; people never see it. */
export const CONTACT_HONEYPOT_FIELD = "website";

export const contactFormSchema = z.object({
    email: z.email("Digite um email válido.").trim().toLowerCase(),
    message: messageBodySchema,
    [CONTACT_HONEYPOT_FIELD]: z.string(),
});

export type ContactFormValues = z.input<typeof contactFormSchema>;

export const contactMessageInputSchema = contactFormSchema.extend({
    captchaToken: z.string().nullable(),
});
