import type { ReactNode } from "react";
import { StandaloneMessageScreen } from "#/shared/ui/standalone-message-screen";

/** Everyone but admins lands here while maintenance is on; their videos are kept as they were. */
export function MaintenanceScreen(): ReactNode {
    return (
        <StandaloneMessageScreen
            title="O Nelcota está em manutenção"
            description="Voltamos em instantes. Seus vídeos e cortes continuam guardados."
        />
    );
}
