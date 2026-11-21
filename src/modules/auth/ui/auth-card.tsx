import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { MASCOT_COUNT, Mascot } from "#/shared/ui/mascot";

const ALL_MASCOT_INDEXES = Array.from({ length: MASCOT_COUNT }, (_, index) => index);

interface AuthCardProps {
    title: string;
    description: string;
    footer: { text: string; linkLabel: string; linkTo: "/sign-in" | "/sign-up" };
    children: ReactNode;
}

/** Decorative: every mascot a video can get. Phones skip it so the form is the first thing seen. */
function MascotShowcase(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className="hidden content-center gap-10 rounded-2xl bg-secondary p-12 lg:grid"
        >
            <div className="mx-auto grid w-full max-w-xl grid-cols-8 gap-3.5">
                {ALL_MASCOT_INDEXES.map((index) => (
                    <Mascot
                        key={index}
                        index={index}
                        className="aspect-square size-auto w-full odd:translate-y-2"
                    />
                ))}
            </div>
            <div className="mx-auto max-w-md text-center">
                <p className="text-heading font-semibold tracking-[-0.02em]">
                    Vídeos longos viram cortes verticais
                </p>
                <p className="mt-3 text-muted-foreground">
                    Cada vídeo ganha um mascote, e uma equipe cuida de cada etapa: um baixa, outro
                    transcreve, outro escolhe os melhores momentos e o último faz os cortes.
                </p>
            </div>
        </div>
    );
}

export function AuthCard({ title, description, footer, children }: AuthCardProps): ReactNode {
    return (
        <main className="grid min-h-dvh lg:grid-cols-[minmax(380px,1fr)_1.1fr] lg:gap-2 lg:p-2">
            <div className="flex justify-center px-4 py-8 lg:items-center">
                <div className="grid w-full max-w-sm gap-6">
                    <BrandLogo />
                    <div>
                        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">
                            {title}
                        </h1>
                        <p className="mt-2 text-muted-foreground">{description}</p>
                    </div>
                    {children}
                    <p className="text-center text-sm text-muted-foreground">
                        {footer.text}{" "}
                        <Link
                            to={footer.linkTo}
                            className="inline-block rounded font-medium text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
                        >
                            {footer.linkLabel}
                        </Link>
                    </p>
                </div>
            </div>
            <MascotShowcase />
        </main>
    );
}
