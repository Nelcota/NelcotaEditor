import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { textLinkClass } from "#/shared/ui/button";

interface AuthEntryLayoutProps {
    title: string;
    /** One line under the title, for screens that need to say what happens next. */
    description?: string;
    accountLink?: {
        text: string;
        label: string;
        to: "/sign-in" | "/sign-up" | "/forgot-password";
    };
    children: ReactNode;
}

/**
 * The frame of every way into the app (sign in, sign up, password reset, email confirmation): one
 * centred column with
 * the logo, the title, the form and, below a rule, the way to support.
 */
export function AuthEntryLayout({
    title,
    description,
    accountLink,
    children,
}: AuthEntryLayoutProps): ReactNode {
    return (
        <main className="grid min-h-dvh place-items-center bg-frame px-6 py-10 text-foreground">
            <div className="grid w-full max-w-md justify-items-center gap-10">
                <header className="min-w-0">
                    <BrandLogo className="gap-3 text-3xl whitespace-normal [&>svg]:h-9" />
                </header>
                <section aria-labelledby="auth-entry-title" className="grid w-full min-w-0 gap-8">
                    <div className="grid gap-3 text-center">
                        <h1
                            id="auth-entry-title"
                            className="text-center text-display font-extrabold tracking-display text-balance"
                        >
                            {title}
                        </h1>
                        {description !== undefined && (
                            <p className="text-pretty text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {children}
                    {accountLink !== undefined && (
                        <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-muted-foreground">
                            {accountLink.text}
                            <Link to={accountLink.to} className={textLinkClass}>
                                {accountLink.label}
                            </Link>
                        </p>
                    )}
                </section>
                <footer className="w-full border-t border-border pt-5 text-center">
                    <Link to="/contact" className={textLinkClass}>
                        Fale com o suporte
                    </Link>
                </footer>
            </div>
        </main>
    );
}
