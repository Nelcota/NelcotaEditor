import { recordAdminAction } from "#/modules/admin/server/record-admin-action.server";
import type { TicketReplyInput } from "#/modules/support/model/support-ticket";
import { notifyTicketReply } from "#/modules/support/server/notify-ticket-reply.server";
import { closeStaffTicket, replyAsStaff } from "#/modules/support/server/staff-tickets.server";

/** Saves the answer, queues the customer's email and records it; false for no such ticket. */
export async function answerSupportTicket(
    adminId: string,
    reply: TicketReplyInput,
): Promise<boolean> {
    const { ticketId, message } = reply;
    const messageId = await replyAsStaff({ adminId, ticketId, body: message });

    if (messageId === null) {
        return false;
    }

    await notifyTicketReply({ ticketId, replyText: message });
    await recordAdminAction({
        action: "reply-ticket",
        adminId,
        targetUserId: null,
        videoId: null,
        details: { ticketId },
    });
    return true;
}

export async function closeSupportTicket(adminId: string, ticketId: string): Promise<boolean> {
    if ((await closeStaffTicket(ticketId)) === false) {
        return false;
    }

    await recordAdminAction({
        action: "close-ticket",
        adminId,
        targetUserId: null,
        videoId: null,
        details: { ticketId },
    });
    return true;
}
