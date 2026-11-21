import LoginIcon from "~icons/solar/login-2-linear";
import LogoutIcon from "~icons/solar/logout-2-linear";
import ShieldCheckIcon from "~icons/solar/shield-check-linear";
import ShieldCrossIcon from "~icons/solar/shield-cross-linear";
import TrashBinTrashIcon from "~icons/solar/trash-bin-trash-linear";
import UserBlockIcon from "~icons/solar/user-block-linear";
import UserCheckIcon from "~icons/solar/user-check-linear";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import type { AdminUserDetails } from "#/modules/admin/admin-views";
import { AdminConfirmDialog } from "#/modules/admin/ui/admin-confirm-dialog";
import type { AdminConfirmation } from "#/modules/admin/ui/admin-confirm-dialog";
import { toUserConfirmation } from "#/modules/admin/ui/admin-user-confirmations";
import type { AdminUserAction } from "#/modules/admin/ui/admin-user-confirmations";
import { useStartImpersonation } from "#/modules/auth/ui/use-impersonation";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";

const BAN_REASON_ID = "ban-reason";
const MAX_BAN_REASON_LENGTH = 300;

function BanReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={BAN_REASON_ID}>Motivo (opcional, só admins veem)</Label>
            <Input
                id={BAN_REASON_ID}
                value={value}
                maxLength={MAX_BAN_REASON_LENGTH}
                onChange={(event) => onChange(event.target.value)}
                className="h-11"
            />
        </div>
    );
}

function OwnAccountNote(): ReactNode {
    return (
        <p className="max-w-prose rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Esta é a sua conta. Bloquear, excluir ou tirar o seu acesso de admin fica desligado
            aqui, para você não se trancar fora do painel.
        </p>
    );
}

interface ActionButtonsProps {
    details: AdminUserDetails;
    onPick: (action: AdminUserAction) => void;
}

/** Another admin is protected: remove the role first, then the account can be acted on. */
function ActionButtons({ details, onPick }: ActionButtonsProps): ReactNode {
    const user = details.user;
    const impersonation = useStartImpersonation(user.id);
    const isProtected = user.isAdmin;

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    disabled={isProtected || user.isBanned || impersonation.isRunning}
                    aria-busy={impersonation.isRunning}
                    onClick={impersonation.run}
                >
                    <LoginIcon aria-hidden="true" />
                    Entrar como esta pessoa
                </Button>
                {user.isBanned === false && (
                    <Button variant="outline" disabled={isProtected} onClick={() => onPick("ban")}>
                        <UserBlockIcon aria-hidden="true" />
                        Bloquear
                    </Button>
                )}
                {user.isBanned === true && (
                    <Button variant="outline" onClick={() => onPick("unban")}>
                        <UserCheckIcon aria-hidden="true" />
                        Desbloquear
                    </Button>
                )}
                {user.isAdmin === false && (
                    <Button variant="outline" onClick={() => onPick("grant-admin")}>
                        <ShieldCheckIcon aria-hidden="true" />
                        Tornar admin
                    </Button>
                )}
                {user.isAdmin === true && (
                    <Button variant="outline" onClick={() => onPick("revoke-admin")}>
                        <ShieldCrossIcon aria-hidden="true" />
                        Remover admin
                    </Button>
                )}
                <Button
                    variant="outline"
                    disabled={isProtected || details.sessions.length === 0}
                    onClick={() => onPick("end-sessions")}
                >
                    <LogoutIcon aria-hidden="true" />
                    Encerrar sessões
                </Button>
                <Button
                    variant="destructive"
                    disabled={isProtected}
                    onClick={() => onPick("delete")}
                >
                    <TrashBinTrashIcon aria-hidden="true" />
                    Excluir conta
                </Button>
            </div>
            {isProtected === true && (
                <p className="text-xs text-muted-foreground">
                    Para bloquear, excluir ou entrar nesta conta, remova o acesso de admin primeiro.
                </p>
            )}
            <FormAlert message={impersonation.errorMessage} />
        </div>
    );
}

export function AdminUserActions({ details }: { details: AdminUserDetails }): ReactNode {
    const navigate = useNavigate();
    const [action, setAction] = useState<AdminUserAction | null>(null);
    const [banReason, setBanReason] = useState("");

    if (details.isCurrentAdmin === true) {
        return <OwnAccountNote />;
    }

    let confirmation: AdminConfirmation | null = null;

    if (action !== null) {
        confirmation = toUserConfirmation(action, {
            user: details.user,
            banReason: banReason.trim(),
            onDeleted: async () => {
                await navigate({ to: "/admin/users" });
            },
        });
    }

    return (
        <>
            <ActionButtons
                details={details}
                onPick={(picked) => {
                    setBanReason("");
                    setAction(picked);
                }}
            />
            <AdminConfirmDialog confirmation={confirmation} onClose={() => setAction(null)}>
                {action === "ban" && <BanReasonField value={banReason} onChange={setBanReason} />}
            </AdminConfirmDialog>
        </>
    );
}
