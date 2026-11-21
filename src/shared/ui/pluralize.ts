/** Portuguese only has "one" and "other" for these words: 1 vídeo, 0 vídeos, 2 vídeos. */
export function pluralize(count: number, singular: string, plural: string): string {
    if (count === 1) {
        return singular;
    }

    return plural;
}
