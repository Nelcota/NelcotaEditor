import { createServerFn } from "@tanstack/react-start";
import { contactMessageInputSchema } from "#/modules/support/model/contact-form";
import { receiveContactMessage } from "#/modules/support/server/guest-ticket.server";

/** Public: anyone can call it, so Turnstile and the honeypot guard it, and Cloudflare limits it. */
export const sendContactMessage = createServerFn({ method: "POST" })
    .validator(contactMessageInputSchema)
    .handler(async ({ data }): Promise<void> => receiveContactMessage(data));
