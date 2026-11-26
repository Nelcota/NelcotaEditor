export type ViralFormatId = "split-screen" | "ranking" | "this-or-that" | "generic" | "hacking";

export const FORMAT_EXAMPLE_WIDTH = 720;
export const FORMAT_EXAMPLE_HEIGHT = 1280;

/** Free formats are open to everyone; each month a new one arrives for subscribers only. */
export type FormatAccess = "free" | "subscriber";

/** A finished edit in the format, played in its dialog. */
export interface FormatExample {
    videoUrl: string;
    posterUrl: string;
    /** WebVTT captions of what is said, in Portuguese. */
    captionsUrl: string;
}

export interface ViralFormat {
    id: ViralFormatId;
    access: FormatAccess;
    name: string;
    tagline: string;
    description: string;
    highlights: ReadonlyArray<string>;
    example?: FormatExample;
}

export const VIRAL_FORMATS: ReadonlyArray<ViralFormat> = [
    {
        id: "split-screen",
        access: "free",
        name: "Tela dividida",
        tagline: "Conteúdo em cima, você embaixo.",
        description:
            "Os prints, produtos ou vídeos de apoio aparecem na metade de cima enquanto você fala na de baixo.",
        highlights: [
            "Ideal para reagir a prints, vídeos e resultados",
            "Corte automático das pausas e respiros",
            "Legenda dinâmica palavra por palavra",
        ],
        example: {
            videoUrl: "/viral-formats/split-screen-example.mp4",
            posterUrl: "/viral-formats/split-screen-example-poster.webp",
            captionsUrl: "/viral-formats/split-screen-example.vtt",
        },
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
        name: "Contraste",
        tagline: "Compare opções com marcações de bom e ruim.",
        description:
            "Você apresenta as opções em tela cheia, e a edição destaca sua avaliação enquanto você fala de cada uma.",
        highlights: [
            "Tema da comparação no topo do vídeo",
            "Marcações de bom e ruim com o nome da opção em destaque",
            "Bom para comparar produtos, hábitos e estratégias",
        ],
        example: {
            videoUrl: "/viral-formats/contrast-example.mp4",
            posterUrl: "/viral-formats/contrast-example-poster.webp",
            captionsUrl: "/viral-formats/contrast-example.vtt",
        },
    },
    {
        id: "generic",
        access: "free",
        name: "Dinâmico gamificado",
        tagline: "Cortes rápidos e efeitos no ritmo da fala.",
        description:
            "Você fala para a câmera enquanto cortes, textos e efeitos destacam as partes mais importantes.",
        highlights: [
            "Palavras-chave em destaque na legenda",
            "Ícones e efeitos sonoros pontuam a fala",
            "Mudanças de enquadramento nos momentos de ênfase",
        ],
        example: {
            videoUrl: "/viral-formats/dynamic-gamified-example.mp4",
            posterUrl: "/viral-formats/dynamic-gamified-example-poster.webp",
            captionsUrl: "/viral-formats/dynamic-gamified-example.vtt",
        },
    },
    {
        id: "hacking",
        access: "free",
        name: "Hacking",
        tagline: "Dicas e ferramentas em uma sequência numerada.",
        description:
            "Apresente uma lista de dicas ou ferramentas com números no topo da tela e um destaque visual para cada item.",
        highlights: [
            "Números mostram o progresso da lista",
            "Cada ferramenta aparece em destaque quando é citada",
            "Tema da lista em destaque na tela",
        ],
        example: {
            videoUrl: "/viral-formats/hacking-example.mp4",
            posterUrl: "/viral-formats/hacking-example-poster.webp",
            captionsUrl: "/viral-formats/hacking-example.vtt",
        },
    },
];
