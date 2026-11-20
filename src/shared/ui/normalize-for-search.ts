/** Lowercase, without accents and surrounding spaces: "  Edição " and "edicao" compare equal. */
export function normalizeForSearch(text: string): string {
    return text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}
