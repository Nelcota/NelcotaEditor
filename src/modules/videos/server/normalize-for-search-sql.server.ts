import { sql } from "drizzle-orm";
import type { AnyColumn, SQL } from "drizzle-orm";

// The combining accents NFD splits off, so "Edição" matches "edicao" as in normalizeForSearch.
const COMBINING_MARKS_PATTERN = "[̀-ͯ]";

/** The database side of normalizeForSearch: lowercase and without accents. */
export function normalizeForSearchSql(value: SQL | AnyColumn): SQL {
    return sql`lower(regexp_replace(normalize(${value}, NFD), ${COMBINING_MARKS_PATTERN}, '', 'g'))`;
}
