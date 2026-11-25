import { createServerFn } from "@tanstack/react-start";
import { SITE_PREVIEW_IMAGE_PATH } from "#/modules/shell/model/site-preview";
import { toPublicUrl } from "#/shared/server/public-url.server";

/** Link previews need an absolute image link, and only the server knows the app's address. */
export const getSitePreviewImageUrl = createServerFn({ method: "GET" }).handler((): string =>
    toPublicUrl(SITE_PREVIEW_IMAGE_PATH),
);
