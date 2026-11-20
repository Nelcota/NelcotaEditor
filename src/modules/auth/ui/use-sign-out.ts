import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";

const SIGN_OUT_FAILED_MESSAGE = "Não foi possível sair. Tente novamente.";

interface SignOut {
    signOut: () => Promise<void>;
    isSigningOut: boolean;
    errorMessage: string | null;
}

/** Ends the session; on failure the person stays here, sees why, and can try again. */
export function useSignOut(): SignOut {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const signOut = async (): Promise<void> => {
        setIsSigningOut(true);
        setErrorMessage(null);
        const failure = await runAuthRequest(() => authClient.signOut());

        if (failure !== null) {
            setErrorMessage(SIGN_OUT_FAILED_MESSAGE);
            setIsSigningOut(false);
            return;
        }

        await router.navigate({ to: "/sign-in" });
        // Cleared after leaving the page, so its queries do not refetch without a session.
        // The cached videos and clips belong to the account that just left this browser.
        queryClient.clear();
    };

    return { signOut, isSigningOut, errorMessage };
}
