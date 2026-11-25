/** Where an admin loads another account's uploaded photo. */
export function toAdminAvatarPath(userId: string): string {
    return `/api/admin/users/${encodeURIComponent(userId)}/avatar`;
}
