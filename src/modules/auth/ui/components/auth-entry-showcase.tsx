import type { ReactNode } from "react";

export function AuthEntryShowcase(): ReactNode {
    return (
        <section
            aria-labelledby="auth-entry-showcase"
            className="theme-app hidden min-w-0 content-center justify-items-center border-s border-border bg-background px-8 py-8 text-foreground lg:grid xl:px-12"
        >
            <div className="grid w-full max-w-2xl gap-5">
                <h2 id="auth-entry-showcase" className="text-title font-bold tracking-display">
                    Do vídeo bruto ao corte final
                </h2>
                <figure className="grid gap-2">
                    <img
                        src="/auth/sign-in-studio.webp"
                        alt="Studio com a prévia vertical, as legendas e a linha do tempo do corte."
                        width={1240}
                        height={740}
                        className="h-auto w-full rounded-xl border border-stage-foreground/20"
                    />
                    <figcaption className="text-sm font-semibold">Studio</figcaption>
                </figure>
                <figure className="grid w-4/5 gap-2 justify-self-end">
                    <div className="rounded-xl border border-stage-foreground/20 bg-card p-3">
                        <img
                            src="/auth/sign-in-formats.webp"
                            alt="Galeria com os modelos Tela dividida, Ranking, Contraste, Genérico e App."
                            width={1104}
                            height={448}
                            loading="lazy"
                            className="h-auto w-full"
                        />
                    </div>
                    <figcaption className="text-sm font-semibold">Formatos Virais</figcaption>
                </figure>
            </div>
        </section>
    );
}
