import type { ReactNode } from "react";
import { ProfileDialog } from "#/modules/auth/ui/profile-dialog";

interface AvatarDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** The profile dialog opened on its photo step. */
export function AvatarDialog({ isOpen, onOpenChange }: AvatarDialogProps): ReactNode {
    return <ProfileDialog isOpen={isOpen} onOpenChange={onOpenChange} initialStep="photo" />;
}
