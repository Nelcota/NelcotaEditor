/** Longer words are cut when the transcript is saved and refused when a caption is edited. */
export const MAX_CAPTION_WORD_LENGTH = 60;

export interface TranscriptWord {
    text: string;
    startSeconds: number;
    endSeconds: number;
}
