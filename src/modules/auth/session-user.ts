export interface SessionUser {
    id: string;
    name: string;
    email: string;
    /** Raw `user.image`; decode it with `toAvatar`. */
    image: string | null;
    isAdmin: boolean;
    /** True while an admin is signed in as this user from the admin panel. */
    isImpersonated: boolean;
}
