import type { ReactNode } from "react";
import { toAvatar } from "#/modules/auth/avatar";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

const MAX_INITIALS = 2;
const FRAME_CLASS =
    "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary";

function toInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");

    if (initials.length === 0) {
        return "?";
    }

    if (initials.length <= MAX_INITIALS) {
        return initials;
    }

    return `${initials.charAt(0)}${initials.charAt(initials.length - 1)}`;
}

interface UserAvatarProps {
    name: string;
    image: string | null;
    className?: string;
}

/** Photo, chosen mascot or initials, always in the same round frame. Decorative: the name is nearby. */
export function UserAvatar({ name, image, className }: UserAvatarProps): ReactNode {
    const avatar = toAvatar(image);
    const frameClass = cn(FRAME_CLASS, className);

    if (avatar.kind === "photo") {
        return (
            <span className={frameClass} aria-hidden="true">
                <img
                    src={avatar.url}
                    alt=""
                    className="size-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
                />
            </span>
        );
    }

    if (avatar.kind === "mascot") {
        return (
            <span className={frameClass} aria-hidden="true">
                <Mascot index={avatar.index} className="size-[78%]" />
            </span>
        );
    }

    return (
        <span className={cn(FRAME_CLASS, "text-xs font-bold", className)} aria-hidden="true">
            {toInitials(name)}
        </span>
    );
}
