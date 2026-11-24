/** The parts of a TanStack Form API this reads; each field's input id matches its name. */
interface FieldErrorSource<FieldName extends string> {
    getFieldMeta: (name: FieldName) => { errors: Array<unknown> } | undefined;
}

/**
 * Moves focus to the first field, in page order, that failed validation, so a screen reader reads
 * its error at once. Reads the form state instead of `[aria-invalid=true]`: the inputs only get
 * that attribute on the next render, after this runs.
 */
export function focusFirstInvalidField<FieldName extends string>(
    fieldNames: ReadonlyArray<FieldName>,
    form: FieldErrorSource<FieldName>,
): void {
    const firstInvalidName = fieldNames.find((name) => {
        const meta = form.getFieldMeta(name);

        if (meta === undefined) {
            return false;
        }

        return meta.errors.length > 0;
    });

    if (firstInvalidName === undefined) {
        return;
    }

    const input = document.getElementById(firstInvalidName);

    if (input === null) {
        return;
    }

    input.focus();
}
