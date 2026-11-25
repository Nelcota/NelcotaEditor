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

/** The site's logo: the ghost and the uppercase wordmark. */
function SiteLogo(): ReactNode {
    return (
        <span className="flex items-center gap-2.5 text-[1.3125rem] leading-none font-bold tracking-[-0.01em]">
            <BrandMark className="size-7" />
            NELCOTA
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
        <main className="theme-site grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(26rem,1fr)_1.15fr] lg:gap-2 lg:p-2">
            <div className="grid grid-rows-[auto_1fr] gap-8 px-5 py-6 sm:px-10 lg:py-5">
                <SiteLogo />
                <div className="grid w-full max-w-sm content-center gap-6 justify-self-center">
                    <div className="grid gap-3">
                        <p className="font-mono text-xs font-medium tracking-[0.08em] text-foreground/65 uppercase">
                            <span className="text-primary-ink">[</span> {eyebrow}{" "}
                            <span className="text-primary-ink">]</span>
                        </p>
                        <h1 className="text-[2.375rem] leading-[1.08] font-[420] tracking-[-0.035em] text-balance">
                            {title.lead} <strong className="font-[560]">{title.emphasis}</strong>
                        </h1>
                        <p className="text-foreground/65">{description}</p>
                    </div>
                    {children}
                    <p className="text-center text-sm text-foreground/65">
                        {footer.text}{" "}
                        <Link
                            to={footer.linkTo}
                            className="inline-block rounded font-semibold text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
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
