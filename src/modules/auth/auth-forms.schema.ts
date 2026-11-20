import { z } from "zod";

/** Shared with the Better Auth config, so the form and the server never disagree. */
export const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;

const emailSchema = z.email("Digite um email válido.");
const nameSchema = z
    .string()
    .trim()
    .min(1, "Digite seu nome.")
    .max(MAX_NAME_LENGTH, "Nome muito longo.");
export const NEW_PASSWORD_HINT = `Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;

const newPasswordSchema = z
    .string()
    .min(MIN_PASSWORD_LENGTH, `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);

export const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Digite sua senha."),
});

export const signUpSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
});

export const profileNameSchema = z.object({ name: nameSchema });

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Digite sua senha atual."),
    newPassword: newPasswordSchema,
});

export const deleteAccountSchema = z.object({
    password: z.string().min(1, "Digite sua senha para confirmar."),
});
