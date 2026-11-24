import type { AdminUserRow } from "#/modules/admin/model/admin-views";
import type { AdminConfirmation } from "#/modules/admin/ui/components/admin-confirm-dialog";
import {
    banUser,
    deleteUser,
    revokeUserSessions,
    setUserAdminRole,
    unbanUser,
} from "#/modules/admin/server/admin-user-functions";

export type AdminUserAction =
    | "ban"
    | "unban"
    | "grant-admin"
    | "revoke-admin"
    | "end-sessions"
    | "delete";

interface ConfirmationContext {
    user: AdminUserRow;
    banReason: string;
    onDeleted: () => Promise<void>;
}

type ConfirmationBuilder = (context: ConfirmationContext) => AdminConfirmation;

/** One entry per action, so the screen picks by name instead of branching. */
const CONFIRMATIONS: Record<AdminUserAction, ConfirmationBuilder> = {
    ban: ({ user, banReason }) => ({
        title: `Bloquear ${user.name}?`,
        description:
            "A pessoa sai de todos os aparelhos agora e não consegue entrar de novo até você desbloquear. Vídeos e cortes ficam guardados.",
        confirmLabel: "Bloquear conta",
        isDestructive: true,
        run: async () => {
            await banUser({ data: { userId: user.id, reason: banReason } });
        },
    }),
    unban: ({ user }) => ({
        title: `Desbloquear ${user.name}?`,
        description: "A pessoa volta a poder entrar com o email e a senha de sempre.",
        confirmLabel: "Desbloquear conta",
        isDestructive: false,
        run: async () => {
            await unbanUser({ data: { userId: user.id } });
        },
    }),
    "grant-admin": ({ user }) => ({
        title: `Tornar ${user.name} admin?`,
        description:
            "A pessoa passa a ver este painel e a poder bloquear, excluir e entrar em qualquer conta que não seja de admin.",
        confirmLabel: "Tornar admin",
        isDestructive: false,
        run: async () => {
            await setUserAdminRole({ data: { userId: user.id, isAdmin: true } });
        },
    }),
    "revoke-admin": ({ user }) => ({
        title: `Remover o acesso de admin de ${user.name}?`,
        description: "A conta continua funcionando normalmente, só sem acesso a este painel.",
        confirmLabel: "Remover admin",
        isDestructive: false,
        run: async () => {
            await setUserAdminRole({ data: { userId: user.id, isAdmin: false } });
        },
    }),
    "end-sessions": ({ user }) => ({
        title: `Encerrar as sessões de ${user.name}?`,
        description:
            "A pessoa sai de todos os aparelhos e precisa entrar de novo. Útil quando um aparelho foi perdido ou a senha vazou.",
        confirmLabel: "Encerrar sessões",
        isDestructive: false,
        run: async () => {
            await revokeUserSessions({ data: { userId: user.id } });
        },
    }),
    delete: ({ user, onDeleted }) => ({
        title: `Excluir a conta de ${user.name}?`,
        description: `A conta ${user.email}, todos os vídeos e todos os cortes serão apagados. Isso não pode ser desfeito.`,
        confirmLabel: "Excluir conta",
        isDestructive: true,
        run: async () => {
            await deleteUser({ data: { userId: user.id } });
        },
        onDone: onDeleted,
    }),
};

export function toUserConfirmation(
    action: AdminUserAction,
    context: ConfirmationContext,
): AdminConfirmation {
    return CONFIRMATIONS[action](context);
}
