const FILE_NOT_FOUND_CODE = "ENOENT";

/** Node's fs errors carry the reason in `code`; ENOENT means the path does not exist. */
export function isFileNotFoundError(error: unknown): boolean {
    return error instanceof Error && "code" in error && error.code === FILE_NOT_FOUND_CODE;
}
