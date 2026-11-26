import ArrowRightIcon from "~icons/lucide/arrow-right";
import CheckIcon from "~icons/lucide/check";
import ExternalLinkIcon from "~icons/lucide/external-link";
import { Link } from "@tanstack/react-router";
import { useId } from "react";
import type { ReactNode } from "react";
import { CLAUDE_LINKS } from "#/modules/shell/model/getting-started";
import type { ChecklistEntry } from "#/modules/shell/ui/hooks/use-getting-started-checklist";
import { Button } from "#/shared/ui/button";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import { cn } from "#/shared/ui/cn";
import { Progress } from "#/shared/ui/progress";

const PERCENT = 100;

function ChecklistItem({ entry }: { entry: ChecklistEntry }): ReactNode {
    const inputId = useId();
    const descriptionId = useId();

    return (
        <li>
            <label
                htmlFor={inputId}
                className="flex items-start gap-3 rounded-xl border border-transparent bg-card p-3.5 transition-colors hover:border-card-border"
            >
                <span className="relative mt-0.5 grid size-5.5 shrink-0 place-items-center">
                    <input
                        id={inputId}
                        type="checkbox"
                        checked={entry.isDone}
                        onChange={entry.toggle}
                        aria-describedby={descriptionId}
                        className="peer size-full appearance-none rounded-sm border-2 border-input outline-none transition-colors checked:border-primary-solid checked:bg-primary-solid focus-visible:ring-4 focus-visible:ring-ring"
                    />
                    <CheckIcon
                        aria-hidden="true"
                        className="pointer-events-none absolute size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100"
                    />
                </span>
                <span className="grid gap-0.5">
                    <span
                        className={cn(
                            "font-semibold",
                            entry.isDone === true &&
                                "text-muted-foreground line-through decoration-muted-foreground",
                        )}
                    >
                        {entry.title}
                    </span>
                    <span id={descriptionId} className="text-meta text-muted-foreground">
                        {entry.description}
                    </span>
                </span>
            </label>
        </li>
    );
}

function ClaudeLinks(): ReactNode {
    return (
        <ul className="grid gap-2">
            {CLAUDE_LINKS.map((link) => (
                <li key={link.href}>
                    <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center justify-between gap-3 rounded-xl border border-card-border px-3.5 text-sm font-semibold outline-none transition-[border-color,scale] hover:border-input focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
                    >
                        <span className="flex items-center gap-2.5">
                            <ClaudeLogo className="size-4 shrink-0" />
                            {link.label}
                        </span>
                        <ExternalLinkIcon
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                        />
                        <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

interface GettingStartedChecklistProps {
    entries: ReadonlyArray<ChecklistEntry>;
    doneCount: number;
    totalCount: number;
}

/** The steps before the first video, the Claude links they need and the way on. */
export function GettingStartedChecklist({
    entries,
    doneCount,
    totalCount,
}: GettingStartedChecklistProps): ReactNode {
    const headingId = useId();

    return (
        <section
            aria-labelledby={headingId}
            className="grid gap-4 rounded-2xl border border-card-border p-6"
        >
            <div className="grid gap-2.5">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 id={headingId} className="text-lg font-bold">
                        Seu checklist
                    </h2>
                    <span className="text-meta text-muted-foreground tabular-nums">
                        {doneCount} de {totalCount}
                    </span>
                </div>
                <Progress
                    value={(doneCount / totalCount) * PERCENT}
                    aria-label="Progresso do checklist"
                    className="h-1.5"
                />
            </div>
            <ul className="grid gap-2.5">
                {entries.map((entry) => (
                    <ChecklistItem key={entry.id} entry={entry} />
                ))}
            </ul>
            <ClaudeLinks />
            <Button asChild size="lg" className="mt-1 font-bold">
                <Link to="/videos" search={{ newVideo: true }} preload="intent">
                    Enviar meu primeiro vídeo
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
            </Button>
        </section>
    );
}
