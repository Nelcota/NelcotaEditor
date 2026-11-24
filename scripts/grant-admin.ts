import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";

// The first admin cannot be made from the panel, so it is granted here, to an account that
// already exists. Run it only for an account you know is yours: sign-up does not verify emails.
const emailSchema = z.email();

class GrantAdminError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GrantAdminError";
    }
}

function readEmailArgument(): string {
    const result = emailSchema.safeParse(process.argv[2]?.trim().toLowerCase());

    if (result.success === false) {
        throw new GrantAdminError('Usage: bun run admin:grant -- "person@example.com"');
    }

    return result.data;
}

async function grantAdmin(email: string): Promise<void> {
    const rows = await db
        .update(user)
        .set({ role: ADMIN_ROLE })
        .where(eq(sql`lower(${user.email})`, email))
        .returning({ id: user.id });

    if (rows.length === 0) {
        throw new GrantAdminError(`No account uses ${email}. Sign up with it first.`);
    }

    console.info(`${email} is now an admin. Reload the app to see the admin panel.`);
}

await grantAdmin(readEmailArgument());
await db.$client.end();
