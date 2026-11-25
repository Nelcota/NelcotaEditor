import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthShowcase } from "#/modules/auth/ui/components/auth-showcase";
import { BrandMark } from "#/shared/ui/brand-logo";

export interface AuthTitle {
    lead: string;
    /** The heavier half, as on the public site's hero ("Que bom **te ver de novo**"). */
    emphasis: string;
}

interface AuthCardProps {
    /** The bracketed tag over the title, as on the site's sections. */
    eyebrow: string;
    title: AuthTitle;
    description: string;
    footer: {
        text: string;
        linkLabel: string;
        linkTo: "/sign-in" | "/sign-up" | "/forgot-password";
    };
    /** The form; a page with nothing to fill in leaves it out. */
    children?: ReactNode;
}

/** The site's logo: the symbol and the wordmark. */
function SiteLogo(): ReactNode {
    return (
        <span className="flex items-center gap-2.5 text-logo font-bold tracking-tight">
            <BrandMark className="h-7" />
            Editor Oculto
        </span>
    );
}

/**
 * Sign-in and sign-up (direction B): the form on the public site's page, so the step from the
 * site's "Entrar" keeps its look, and the dark app beside it from lg. Phones keep the form only.
 */
export function AuthCard({
    eyebrow,
    title,
    description,
    footer,
    children,
}: AuthCardProps): ReactNode {
    return (
        <main className="theme-site grid min-h-dvh bg-background text-foreground lg:grid-cols-2 lg:gap-2 lg:p-2">
            <div className="grid grid-rows-[auto_1fr] gap-8 px-5 py-6 sm:px-10 lg:py-5">
                <SiteLogo />
                <div className="grid w-full max-w-md content-center gap-8 justify-self-center">
                    <div className="grid gap-4">
                        <p className="font-mono text-sm font-medium tracking-eyebrow text-foreground/65 uppercase">
                            <span className="text-primary-ink">[</span> {eyebrow}{" "}
                            <span className="text-primary-ink">]</span>
                        </p>
                        <h1 className="text-display font-title tracking-display">
                            {title.lead}{" "}
                            <strong className="block font-title-strong">{title.emphasis}</strong>
                        </h1>
                        <p className="text-lg text-foreground/65">{description}</p>
                    </div>
                    {children}
                    <p className="text-center text-foreground/65">
                        {footer.text}{" "}
                        <Link
                            to={footer.linkTo}
                            className="inline-block rounded font-semibold text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
                        >
                            {footer.linkLabel}
                        </Link>
                    </p>
                </div>
            </div>
            <AuthShowcase />
        </main>
    );
}
