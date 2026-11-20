import { CopyTextButton } from "#/shared/ui/copy-text-button";

/** Copies the clip title to post it. */
export function CopyTitleButton({ title }: { title: string }) {
    return <CopyTextButton text={title} label="Copiar título" className="min-w-36" />;
}
