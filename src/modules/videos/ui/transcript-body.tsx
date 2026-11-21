import { useMemo, useState } from "react";
import type { TranscriptLineView } from "#/modules/transcription/transcript-view";
import { SearchField } from "#/modules/videos/ui/search-field";
import { TranscriptLines } from "#/modules/videos/ui/transcript-lines";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";

const SEARCH_LABEL = "Buscar na transcrição";

function filterLines(lines: Array<TranscriptLineView>, query: string): Array<TranscriptLineView> {
    const normalizedQuery = normalizeForSearch(query);

    if (normalizedQuery.length === 0) {
        return lines;
    }

    return lines.filter((line) => normalizeForSearch(line.text).includes(normalizedQuery));
}

interface TranscriptToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    fullText: string;
}

function TranscriptToolbar({ query, onQueryChange, fullText }: TranscriptToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label={SEARCH_LABEL}
                placeholder={SEARCH_LABEL}
                value={query}
                onValueChange={onQueryChange}
            />
            <CopyTextButton text={fullText} label="Copiar transcrição" className="sm:ms-auto" />
        </div>
    );
}

interface TranscriptBodyProps {
    lines: Array<TranscriptLineView>;
    currentSeconds: number;
    onSeek: (seconds: number) => void;
}

/** The whole transcript, searchable; a line that matches nothing says so instead of going blank. */
export function TranscriptBody({ lines, currentSeconds, onSeek }: TranscriptBodyProps) {
    const [query, setQuery] = useState("");
    // The player re-renders this about four times a second; only redo the work when the text changes.
    const visibleLines = useMemo(() => filterLines(lines, query), [lines, query]);
    const fullText = useMemo(() => lines.map((line) => line.text).join("\n"), [lines]);

    if (lines.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">A Tinta não encontrou fala neste vídeo.</p>
        );
    }

    return (
        <div className="grid gap-3">
            <TranscriptToolbar query={query} onQueryChange={setQuery} fullText={fullText} />
            {visibleLines.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma fala com “{query.trim()}”.</p>
            )}
            {visibleLines.length > 0 && (
                <TranscriptLines
                    lines={visibleLines}
                    currentSeconds={currentSeconds}
                    onSeek={onSeek}
                />
            )}
        </div>
    );
}
