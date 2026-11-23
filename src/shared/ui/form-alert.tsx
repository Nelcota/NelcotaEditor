import { Alert } from "#/shared/ui/alert";

/** A form's error message, or nothing when there is none. */
export function FormAlert({ message }: { message: string | null }) {
    if (message === null) {
        return null;
    }

    return <Alert tone="danger">{message}</Alert>;
}
