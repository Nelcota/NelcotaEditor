export interface SessionUser {
    id: string;
    name: string;
    email: string;
    /** Raw `user.image`; decode it with `toAvatar`. */
    image: string | null;
}
