import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

/** A photo, one of the mascots, or no picture (the initials stand in). */
export type AvatarPicture =
    | { kind: "initials" }
    | { kind: "mascot"; index: number }
    | { kind: "photo"; url: string };

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
    avatar: AvatarPicture;
    className?: string;
}

/** Photo, chosen mascot or initials, always in the same round frame. Decorative: the name is nearby. */
export function UserAvatar({ name, avatar, className }: UserAvatarProps): ReactNode {
    const frameClass = cn(FRAME_CLASS, className);

    if (avatar.kind === "photo") {
        return (
            <span className={frameClass} aria-hidden="true">
                <img
                    src={avatar.url}
                    alt=""
                    className="size-full object-cover outline-1 -outline-offset-1 outline-solid outline-white/10"
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
        // Drawn by CSS, not DOM text: buttons around the avatar name their action ("Trocar foto de
        // perfil"), and visible text in them would have to start that name (WCAG 2.5.3).
        <span
            className={cn(
                FRAME_CLASS,
                "text-xs font-semibold before:content-[attr(data-initials)]",
                className,
            )}
            data-initials={toInitials(name)}
            aria-hidden="true"
        />
    );
}
