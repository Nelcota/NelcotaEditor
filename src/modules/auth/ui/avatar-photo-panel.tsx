import TrashIcon from "~icons/lucide/trash";
import UploadIcon from "~icons/lucide/upload";
import { useEffect, useId, useRef } from "react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { MAX_AVATAR_MEGABYTES } from "#/modules/auth/avatar";
import type { SessionUser } from "#/modules/auth/session-user";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { Spinner } from "#/shared/ui/spinner";

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp";

interface UploadButtonContentProps {
    isUploading: boolean;
    hasAvatar: boolean;
}

function UploadButtonContent({ isUploading, hasAvatar }: UploadButtonContentProps): ReactNode {
    if (isUploading === true) {
        return (
            <>
                <Spinner />
                Enviando…
            </>
        );
    }

    if (hasAvatar === true) {
        return (
            <>
                <UploadIcon aria-hidden="true" />
                Enviar outra foto
            </>
        );
    }

    return (
        <>
            <UploadIcon aria-hidden="true" />
            Enviar foto
        </>
    );
}

interface RemovalFocusOptions {
    hasAvatar: boolean;
    isBusy: boolean;
    onRemove: () => void;
}

interface RemovalFocus {
    fileInputRef: RefObject<HTMLInputElement | null>;
    requestRemove: () => void;
}

/**
 * The remove button unmounts once the photo is gone, so keyboard focus moves to the upload control
 * instead of falling back to the page.
 */
function useRemovalFocus({ hasAvatar, isBusy, onRemove }: RemovalFocusOptions): RemovalFocus {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isRemovingRef = useRef(false);

    useEffect(() => {
        if (isBusy === true || isRemovingRef.current === false) {
            return;
        }

        isRemovingRef.current = false;
        const fileInput = fileInputRef.current;

        if (hasAvatar === true || fileInput === null) {
            return;
        }

        fileInput.focus();
    }, [hasAvatar, isBusy]);

    const requestRemove = (): void => {
        isRemovingRef.current = true;
        onRemove();
    };

    return { fileInputRef, requestRemove };
}

interface AvatarPhotoPanelProps {
    user: SessionUser;
    hasAvatar: boolean;
    isBusy: boolean;
    isUploading: boolean;
    errorMessage: string | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
}

/** The current avatar with the photo actions: upload a new one or go back to initials. */
export function AvatarPhotoPanel(props: AvatarPhotoPanelProps): ReactNode {
    const fileInputId = useId();
    const user = props.user;
    const { fileInputRef, requestRemove } = useRemovalFocus({
        hasAvatar: props.hasAvatar,
        isBusy: props.isBusy,
        onRemove: props.onRemove,
    });

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const input = event.target;
        const file = input.files?.[0];
        // Cleared so picking the same file again still fires a change.
        input.value = "";

        if (file === undefined) {
            return;
        }

        props.onUpload(file);
    };

    return (
        <div className="grid content-start gap-4 sm:border-r sm:pr-8">
            <p className="text-sm font-medium">Sua foto</p>
            <UserAvatar name={user.name} image={user.image} className="size-32 text-2xl" />
            <div className="grid gap-2">
                <div className="grid gap-2">
                    {/* The input comes first so the label (a <label>, where `disabled` does
                        nothing) can show its focus ring and busy state through `peer`. */}
                    <input
                        ref={fileInputRef}
                        id={fileInputId}
                        type="file"
                        accept={ACCEPTED_TYPES}
                        className="peer sr-only"
                        disabled={props.isBusy}
                        onChange={handleFileChange}
                    />
                    <Button
                        asChild
                        variant="secondary"
                        className="w-full peer-focus-visible:ring-4 peer-focus-visible:ring-ring peer-disabled:opacity-50"
                        aria-disabled={props.isBusy}
                        aria-busy={props.isUploading}
                    >
                        <label htmlFor={fileInputId}>
                            <UploadButtonContent
                                isUploading={props.isUploading}
                                hasAvatar={props.hasAvatar}
                            />
                        </label>
                    </Button>
                    {props.hasAvatar === true && (
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={props.isBusy}
                            onClick={requestRemove}
                        >
                            <TrashIcon aria-hidden="true" />
                            Remover foto
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WebP, até {MAX_AVATAR_MEGABYTES} MB.
                </p>
            </div>
            <FormAlert message={props.errorMessage} />
        </div>
    );
}
