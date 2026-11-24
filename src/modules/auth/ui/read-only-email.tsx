import type { ReactNode } from "react";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";

/** The sign-in e-mail, shown beside the name but never edited there. */
export function ReadOnlyEmail({ email }: { email: string }): ReactNode {
    return (
        <div className="grid gap-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
                id="profile-email"
                value={email}
                readOnly
                className="h-11 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
                É o e-mail de entrada; não dá para trocar por aqui.
            </p>
        </div>
    );
}
