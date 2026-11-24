/** One sentence-like line of the transcript, as the browser receives it. */
export interface TranscriptLineView {
    startSeconds: number;
    endSeconds: number;
    text: string;
}

export interface TranscriptView {
    /** The language Whisper heard (ISO 639-1); null when it was not reported. */
    language: string | null;
    lines: Array<TranscriptLineView>;
}
