import ArrowRightIcon from "~icons/lucide/arrow-right";
import PlayIcon from "~icons/lucide/play";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { VIRAL_FORMATS } from "#/modules/viral-formats/model/viral-formats";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { FormatCard } from "#/modules/viral-formats/ui/components/format-card";
import { FormatCover } from "#/modules/viral-formats/ui/components/format-cover";
import { FormatDialog } from "#/modules/viral-formats/ui/components/format-dialog";
import { Button } from "#/shared/ui/button";
import { ClaudeLogo } from "#/shared/ui/claude-logo";

const FEATURED_INDEX = 0;

/** Editing needs the person's Claude: a quiet row with the way to Etapa 1, not a warning. */
function ConnectClaudeNotice(): ReactNode {
    return (
        <section
            aria-labelledby="connect-claude"
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-card-border bg-card p-4 sm:flex-nowrap sm:px-5"
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
                <ClaudeLogo className="size-6" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
                <h2 id="connect-claude" className="font-bold">
                    Conecte o seu Claude para editar
                </h2>
                <p className="text-meta text-muted-foreground">
                    Você já pode ver os formatos. Para editar, conclua a Etapa 1.
                </p>
            </div>
            <Button asChild className="font-bold max-sm:w-full">
                <Link to="/claude">
                    Conectar
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
            </Button>
        </section>
    );
}

interface FeaturedFormatProps {
    format: ViralFormat;
    onOpen: (format: ViralFormat) => void;
}

function FeaturedFormat({ format, onOpen }: FeaturedFormatProps): ReactNode {
    return (
        <section
            aria-labelledby="featured-format"
            className="grid items-center gap-6 rounded-2xl border border-card-border bg-card p-6 md:grid-cols-[minmax(0,1fr)_12rem] md:p-8"
        >
            <div className="grid max-w-xl content-start gap-3">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Formato em destaque
                </p>
                <h2 id="featured-format" className="text-title font-extrabold">
                    {format.name}
                </h2>
                <p className="text-muted-foreground">{format.description}</p>
                <div>
                    <Button
                        type="button"
                        size="lg"
                        className="font-bold"
                        onClick={() => onOpen(format)}
                    >
                        <PlayIcon
                            aria-hidden="true"
                            className="size-4 fill-current *:fill-current"
                        />
                        Usar esse formato
                    </Button>
                </div>
            </div>
            <FormatCover formatId={format.id} className="max-md:hidden" />
        </section>
    );
}

/** Formatos Virais: the formats Editor Oculto edits into, each opening its own details. */
export function FormatsScreen(): ReactNode {
    const [openFormat, setOpenFormat] = useState<ViralFormat | null>(null);
    const featured = VIRAL_FORMATS[FEATURED_INDEX];

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Editor Oculto
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Formatos Virais
                </h1>
                <p className="text-muted-foreground">
                    Suba um ou vários vídeos brutos e o Editor Oculto edita todos no formato
                    escolhido.
                </p>
            </header>
            <ConnectClaudeNotice />
            {featured !== undefined && <FeaturedFormat format={featured} onOpen={setOpenFormat} />}
            <section aria-labelledby="all-formats" className="grid gap-4">
                <h2 id="all-formats" className="flex items-baseline gap-2 text-lg font-bold">
                    Todos os formatos
                    <span className="text-meta font-normal text-muted-foreground">
                        {VIRAL_FORMATS.length} modelos
                    </span>
                </h2>
                <ul className="flex gap-4 overflow-x-auto pb-2">
                    {VIRAL_FORMATS.map((format) => (
                        <FormatCard key={format.id} format={format} onOpen={setOpenFormat} />
                    ))}
                </ul>
            </section>
            {openFormat !== null && (
                <FormatDialog format={openFormat} onClose={() => setOpenFormat(null)} />
            )}
        </div>
    );
}
