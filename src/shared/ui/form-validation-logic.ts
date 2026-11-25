import { revalidateLogic } from "@tanstack/react-form";

/**
 * Every form checks on submit, then on each change once its errors show. With an `onSubmit`
 * validator instead, blurring a field cleared its error even while the field was still empty.
 */
export const FORM_VALIDATION_LOGIC = revalidateLogic({
    mode: "submit",
    modeAfterSubmission: "change",
});
