import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthEntryShowcase } from "#/modules/auth/ui/components/auth-entry-showcase";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { textLinkClass } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

interface AuthEntryLayoutProps {
    title: string;
    layout?: "centered" | "showcase";
    accountLink?: {
        text: string;
        label: string;
        to: "/sign-in" | "/sign-up";
    };
    children: ReactNode;
}

export function AuthEntryLayout({
    title,
    layout = "showcase",
    accountLink,
    children,
}: AuthEntryLayoutProps): ReactNode {
    return (
        <main
            className={cn(
                "grid min-h-dvh bg-frame text-foreground",
                layout === "centered" && "place-items-center px-6 py-8",
                layout === "showcase" && "lg:grid-cols-[minmax(22rem,2fr)_minmax(0,3fr)]",
            )}
        >
            <div
                className={cn(
                    "grid",
                    layout === "centered" && "w-full max-w-lg justify-items-center gap-9 sm:gap-10",
                    layout === "showcase" &&
                        "grid-rows-[auto_1fr_auto] gap-10 px-6 py-6 sm:px-10 sm:py-8",
                )}
            >
                <header className="min-w-0">
                    <BrandLogo
                        className={cn(
                            layout === "centered" &&
                                "gap-3 text-3xl whitespace-normal sm:text-4xl [&>svg]:h-9 sm:[&>svg]:h-10",
                            layout === "showcase" && "text-logo",
                        )}
                    />
                </header>
                <section
                    aria-labelledby="auth-entry-title"
                    className={cn(
                        "grid w-full min-w-0 self-center justify-self-center",
                        layout === "centered" && "gap-8",
                        layout === "showcase" && "max-w-sm gap-7",
                    )}
                >
                    <h1
                        id="auth-entry-title"
                        className={cn(
                            "font-extrabold tracking-display",
                            layout === "centered" && "text-center text-display sm:text-5xl",
                            layout === "showcase" && "text-4xl",
                        )}
                    >
                        {title}
                    </h1>
                    {children}
                    {accountLink !== undefined && (
                        <p
                            className={cn(
                                "flex flex-wrap items-baseline gap-x-2 gap-y-1 text-muted-foreground",
                                layout === "centered" && "justify-center text-base sm:text-lg",
                                layout === "showcase" && "text-sm",
                            )}
                        >
                            {accountLink.text}
                            <Link
                                to={accountLink.to}
                                className={cn(
                                    textLinkClass,
                                    layout === "centered" && "text-base sm:text-lg",
                                )}
                            >
                                {accountLink.label}
                            </Link>
                        </p>
                    )}
                </section>
                <footer
                    className={cn(
                        "border-t border-border",
                        layout === "centered" && "w-full pt-5 text-center",
                        layout === "showcase" && "pt-4",
                    )}
                >
                    <Link
                        to="/contact"
                        className={cn(
                            textLinkClass,
                            layout === "centered" && "text-base sm:text-lg",
                        )}
                    >
                        Fale com o suporte
                    </Link>
                </footer>
            </div>
            {layout === "showcase" && <AuthEntryShowcase />}
        </main>
    );
}
