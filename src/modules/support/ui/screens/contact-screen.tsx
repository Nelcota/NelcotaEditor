import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { CONTACT_HONEYPOT_FIELD, contactFormSchema } from "#/modules/support/model/contact-form";
import type { ContactFormValues } from "#/modules/support/model/contact-form";
import { sendContactMessage } from "#/modules/support/server/contact-functions";
import { BrandMark } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { CaptchaField } from "#/shared/ui/captcha-field";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { HoneypotField } from "#/shared/ui/honeypot-field";
import { TextAreaField } from "#/shared/ui/text-area-field";
import { TextField } from "#/shared/ui/text-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/shared/ui/use-captcha";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const FIELD_NAMES = ["email", "message"] as const;
const FALLBACK_ERROR_MESSAGE =
    "Não foi possível enviar a mensagem. Confira sua conexão e tente de novo.";
const LINK_CLASS =
    "inline-block rounded font-semibold text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99";
const DEFAULT_VALUES: ContactFormValues = { email: "", message: "", [CONTACT_HONEYPOT_FIELD]: "" };

interface ContactScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
    /** Null while support is open; otherwise the line saying it is paused. */
    pausedMessage: string | null;
}

function SignInLine(): ReactNode {
    return (
        <p className="text-sm text-foreground/65">
            Consegue entrar?{" "}
            <Link to="/sign-in" className={LINK_CLASS}>
                Entre e abra um ticket
            </Link>
        </p>
    );
}

function ContactForm({
    captchaSiteKey,
    onSent,
}: {
    captchaSiteKey: string | null;
    onSent: () => void;
}) {
    const track = useTrackPromise();
    const captcha = useCaptcha(captchaSiteKey);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: DEFAULT_VALUES,
        validators: { onSubmit: contactFormSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            try {
                await sendContactMessage({ data: { ...value, captchaToken: captcha.readToken() } });
            } catch (error) {
                captcha.renew();
                setErrorMessage(toErrorMessage(error, FALLBACK_ERROR_MESSAGE));
                return;
            }

            onSent();
        },
    });

    return (
        <form
            noValidate
            className="grid gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                track(form.handleSubmit());
            }}
        >
            <form.Field name="email">
                {(field) => (
                    <TextField
                        id="email"
                        label="Seu email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        autoCapitalize="none"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <form.Field name="message">
                {(field) => (
                    <TextAreaField
                        id="message"
                        label="Mensagem"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <form.Field name={CONTACT_HONEYPOT_FIELD}>
                {(field) => (
                    <HoneypotField
                        name={field.name}
                        value={field.state.value}
                        onValueChange={field.handleChange}
                    />
                )}
            </form.Field>
            <CaptchaField captcha={captcha} />
            <FormAlert message={errorMessage} />
            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type="submit"
                        size="lg"
                        className="h-11"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        Enviar mensagem
                        <ArrowRightIcon aria-hidden="true" />
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

function ContactBody({ captchaSiteKey, pausedMessage }: ContactScreenProps): ReactNode {
    const [isSent, setIsSent] = useState(false);

    if (pausedMessage !== null) {
        return <p className="text-foreground/65">{pausedMessage}</p>;
    }

    if (isSent === true) {
        return (
            <p role="status" className="text-foreground/65">
                Mensagem enviada. Respondemos no email informado.
            </p>
        );
    }

    return <ContactForm captchaSiteKey={captchaSiteKey} onSent={() => setIsSent(true)} />;
}

/** For people who cannot sign in: the public site's look, one form, the answer by email. */
export function ContactScreen(props: ContactScreenProps): ReactNode {
    return (
        <main className="theme-site grid min-h-dvh grid-rows-[auto_1fr] gap-8 bg-background px-5 py-6 text-foreground sm:px-10">
            <span className="flex items-center gap-2.5 text-xl leading-none font-bold">
                <BrandMark className="size-7" />
                NELCOTA
            </span>
            <div className="grid w-full max-w-md content-center gap-6 justify-self-center">
                <div className="grid gap-3">
                    <p className="font-mono text-xs font-medium tracking-[0.08em] text-foreground/65 uppercase">
                        <span className="text-primary-ink">[</span> Contato{" "}
                        <span className="text-primary-ink">]</span>
                    </p>
                    <h1 className="text-4xl leading-tight font-[420] tracking-[-0.035em] text-balance">
                        Fale com o <strong className="font-[560]">suporte</strong>
                    </h1>
                </div>
                <ContactBody {...props} />
                <SignInLine />
            </div>
        </main>
    );
}
