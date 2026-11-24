import type { ReactNode } from "react";
import { ProfileDialog } from "#/modules/auth/ui/profile-dialog";

interface EditProfileDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** The profile dialog opened on its name step. */
export function EditProfileDialog({ isOpen, onOpenChange }: EditProfileDialogProps): ReactNode {
    return <ProfileDialog isOpen={isOpen} onOpenChange={onOpenChange} initialStep="name" />;
}
