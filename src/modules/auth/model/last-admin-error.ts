import { UserFacingError } from "#/shared/server/user-facing-error";

export const LAST_ADMIN_CODE = "LAST_ADMIN";

export const LAST_ADMIN_ROLE_MESSAGE =
    "Esta é a última conta admin. Dê acesso de admin a outra conta primeiro.";

export const LAST_ADMIN_DELETE_MESSAGE =
    "Sua conta é a última com acesso de admin. Dê esse acesso a outra conta antes de excluir a sua.";

/** Without an admin, nobody could open the admin panel to give the role back. */
export class LastAdminError extends UserFacingError {
    constructor() {
        super(LAST_ADMIN_ROLE_MESSAGE);
        this.name = "LastAdminError";
    }
}
