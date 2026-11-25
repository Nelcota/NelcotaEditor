import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import {
    MAX_MESSAGE_LENGTH,
    MAX_SUBJECT_LENGTH,
    MESSAGE_AUTHOR_KINDS,
    TICKET_STATUSES,
} from "#/modules/support/model/support-ticket";
import { videos } from "#/modules/video-records/video-records.schema";

const FIRST_TICKET_NUMBER = 1000;

/** Constant values written into the CHECKs; never user input. */
const TICKET_STATUS_LIST = TICKET_STATUSES.map((status) => `'${status}'`).join(", ");
const AUTHOR_KIND_LIST = MESSAGE_AUTHOR_KINDS.map((kind) => `'${kind}'`).join(", ");

export const supportTickets = pgTable(
    "support_tickets",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        /** The short number people quote ("#1042"); never used to look a ticket up. */
        number: integer("number")
            .generatedAlwaysAsIdentity({ startWith: FIRST_TICKET_NUMBER })
            .notNull()
            .unique(),
        // Deleting the account deletes its tickets; a guest ticket has no account.
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        /** Only for guest tickets from the public form: where the answer is emailed. */
        contactEmail: text("contact_email"),
        videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
        subject: text("subject").notNull(),
        status: text("status", { enum: TICKET_STATUSES }).notNull().default("open"),
        /** An admin answered and the owner has not opened the ticket since. */
        hasUnreadReply: boolean("has_unread_reply").notNull().default(false),
        lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "support_tickets_status_known",
            sql`${table.status} in (${sql.raw(TICKET_STATUS_LIST)})`,
        ),
        check(
            "support_tickets_subject_length",
            sql`char_length(${table.subject}) between 1 and ${sql.raw(String(MAX_SUBJECT_LENGTH))}`,
        ),
        check(
            "support_tickets_has_contact",
            sql`${table.userId} is not null or ${table.contactEmail} is not null`,
        ),
        index("support_tickets_user_id_last_message_at_idx").on(
            table.userId,
            table.lastMessageAt.desc(),
        ),
        index("support_tickets_status_last_message_at_idx").on(table.status, table.lastMessageAt),
        index("support_tickets_video_id_idx").on(table.videoId),
    ],
);

export const supportMessages = pgTable(
    "support_messages",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        ticketId: uuid("ticket_id")
            .notNull()
            .references(() => supportTickets.id, { onDelete: "cascade" }),
        authorKind: text("author_kind", { enum: MESSAGE_AUTHOR_KINDS }).notNull(),
        // A plain id without a foreign key, like the audit log: an admin's answer outlives the
        // admin. Null for a guest.
        authorId: text("author_id"),
        body: text("body").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "support_messages_author_kind_known",
            sql`${table.authorKind} in (${sql.raw(AUTHOR_KIND_LIST)})`,
        ),
        check(
            "support_messages_body_length",
            sql`char_length(${table.body}) between 1 and ${sql.raw(String(MAX_MESSAGE_LENGTH))}`,
        ),
        index("support_messages_ticket_id_created_at_idx").on(table.ticketId, table.createdAt),
    ],
);
