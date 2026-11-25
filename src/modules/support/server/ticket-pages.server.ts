import { and, eq, gt, lt, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { TicketCursor } from "#/modules/support/model/support-ticket";
import { supportTickets } from "#/modules/support/support.schema";

export type TicketOrder = "newest" | "oldest";

/** Newest first pages go back in time; oldest first pages go forward. */
const CURSOR_COMPARISONS: Readonly<Record<TicketOrder, typeof lt>> = { newest: lt, oldest: gt };

interface PagedRow {
    id: string;
    lastMessageAt: Date;
}

/** The rows after the cursor in the list's order; ties on time are broken by id. */
export function afterTicketCursor(
    cursor: TicketCursor | null,
    order: TicketOrder,
): SQL | undefined {
    if (cursor === null) {
        return undefined;
    }

    const cursorTime = new Date(cursor.lastMessageAt);
    const compare = CURSOR_COMPARISONS[order];

    return or(
        compare(supportTickets.lastMessageAt, cursorTime),
        and(eq(supportTickets.lastMessageAt, cursorTime), compare(supportTickets.id, cursor.id)),
    );
}

/** Queries ask for one row more than a page; that extra row only says another page exists. */
export function splitTicketPage<Row extends PagedRow>(
    rows: Array<Row>,
    pageSize: number,
): { pageRows: Array<Row>; nextCursor: TicketCursor | null } {
    if (rows.length <= pageSize) {
        return { pageRows: rows, nextCursor: null };
    }

    const pageRows = rows.slice(0, pageSize);
    const lastRow = pageRows.at(-1);

    if (lastRow === undefined) {
        return { pageRows, nextCursor: null };
    }

    return {
        pageRows,
        nextCursor: { lastMessageAt: lastRow.lastMessageAt.toISOString(), id: lastRow.id },
    };
}
