export const APP_TITLE = "Editor Oculto: cortes com legenda";
export const SITE_PREVIEW_IMAGE_PATH = "/og-image.png";

const APP_DESCRIPTION = "Cole o link de um vídeo e receba cortes curtos com legenda.";
const PREVIEW_IMAGE_WIDTH = 1200;
const PREVIEW_IMAGE_HEIGHT = 630;

type PreviewMeta = { name: string; content: string } | { property: string; content: string };

/**
 * The preview WhatsApp, Telegram and the like show for any link to the app. Pages with their own
 * preview (a shared clip) override these tags one by one.
 */
export function buildSitePreviewMeta(imageUrl: string): Array<PreviewMeta> {
    return [
        { name: "description", content: APP_DESCRIPTION },
        { property: "og:site_name", content: "Editor Oculto" },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: APP_TITLE },
        { property: "og:description", content: APP_DESCRIPTION },
        { property: "og:image", content: imageUrl },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: String(PREVIEW_IMAGE_WIDTH) },
        { property: "og:image:height", content: String(PREVIEW_IMAGE_HEIGHT) },
        { property: "og:image:alt", content: "Editor Oculto" },
        { name: "twitter:card", content: "summary_large_image" },
    ];
}
