const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g;
const LIKE_ESCAPE = "\\";

/** "50%_off" matches that text literally, anywhere: the LIKE wildcards in it are escaped. */
export function toContainsPattern(query: string): string {
    const escaped = query.replace(LIKE_SPECIAL_CHARACTERS, (character) => LIKE_ESCAPE + character);

    return `%${escaped}%`;
}
