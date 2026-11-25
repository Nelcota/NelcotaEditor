export type ViralFormatId = "split-screen" | "ranking" | "this-or-that" | "generic" | "app";

/** Free formats are open to everyone; each month a new one arrives for subscribers only. */
export type FormatAccess = "free" | "subscriber";

export interface ViralFormat {
    id: ViralFormatId;
    access: FormatAccess;
    name: string;
    tagline: string;
    description: string;
    highlights: ReadonlyArray<string>;
}

export const VIRAL_FORMATS: ReadonlyArray<ViralFormat> = [
    {
        id: "split-screen",
        access: "free",
        name: "Tela dividida",
        tagline: "Você em cima, o conteúdo embaixo.",
        description:
            "A tela se divide em duas: de um lado você falando, do outro o print, o vídeo de apoio ou o produto. Prende a atenção sem tirar você de cena.",
        highlights: [
            "Ideal para reagir a prints, vídeos e resultados",
            "Corte automático das pausas e respiros",
            "Legenda dinâmica palavra por palavra",
        ],
    },
    {
        id: "ranking",
        access: "free",
        name: "Ranking",
        tagline: "Top 5, top 10, do pior ao melhor.",
        description:
            "Uma contagem visual que vai revelando posição por posição. Faz a pessoa assistir até o final para descobrir o número 1.",
        highlights: [
            "Lista numerada que aparece no ritmo da sua fala",
            "Destaque no item que você está falando",
            "Bom para listas, dicas e comparativos",
        ],
    },
    {
        id: "this-or-that",
        access: "free",
        name: "Isso ou aquilo",
        tagline: "Duas opções lado a lado.",
        description:
            "Coloca duas escolhas frente a frente e deixa claro qual vence. Gera comentário porque todo mundo quer dar a própria opinião.",
        highlights: [
            "Divisão lado a lado com o OU no meio",
            "Marcação de certo e errado",
            "Bom para comparar produtos, hábitos e estratégias",
        ],
    },
    {
        id: "generic",
        access: "free",
        name: "Genérico",
        tagline: "Talking head limpo com legenda.",
        description:
            "O formato coringa: você falando para a câmera, com cortes secos, zoom nos momentos fortes e legenda. Serve para quase todo conteúdo.",
        highlights: [
            "Remove gaguejos, pausas e repetições",
            "Zoom nos trechos de ênfase",
            "Legenda grande e fácil de ler no celular",
        ],
    },
    {
        id: "app",
        access: "free",
        name: "App",
        tagline: "Demonstração de tela de app ou site.",
        description:
            "Mostra a gravação de tela do app ou site dentro de um celular, com você narrando por cima. Perfeito para tutoriais e demonstrações.",
        highlights: [
            "Gravação de tela dentro de um mockup de celular",
            "Zoom no ponto onde você toca",
            "Bom para tutoriais e vendas de produto digital",
        ],
    },
];
