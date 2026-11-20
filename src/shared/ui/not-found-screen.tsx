import { StandaloneMessageScreen } from "#/shared/ui/standalone-message-screen";

export function NotFoundScreen() {
    return (
        <StandaloneMessageScreen
            title="Página não encontrada"
            description="O endereço pode estar incompleto ou a página não existe mais. Seus vídeos e cortes continuam salvos."
        />
    );
}
