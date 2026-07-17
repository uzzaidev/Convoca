import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getGroupBlockedMessage, getGroupStatusLabel, type GroupStatus } from "@/lib/group-status";

export function GroupStatusNotice({
  status,
  reason,
  groupId,
  isAdmin,
}: {
  status: GroupStatus;
  reason?: string | null;
  groupId?: string;
  isAdmin?: boolean;
}) {
  if (status === "active") return null;

  if (status === "pending") {
    return (
      <Alert className="border-amber-200 bg-amber-50 mb-6">
        <AlertTitle className="font-semibold text-amber-900">
          Grupo em análise — aprovação em até 24h
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3 text-amber-800">
          {isAdmin ? (
            <>
              <p>
                Seu grupo foi criado e está passando pela revisão da equipe Convoca. Convites e
                criação de peladas ficam disponíveis após a aprovação.
              </p>
              <p className="text-sm font-medium">O que você já pode fazer agora:</p>
              <ul className="text-sm list-disc list-inside space-y-1 text-amber-700">
                <li>Configurar nome, descrição e foto do grupo</li>
                <li>Definir horário padrão e local das peladas</li>
                <li>Preparar as configurações do sorteio</li>
              </ul>
              {groupId && (
                <div className="pt-1">
                  <Button asChild size="sm" variant="outline" className="border-amber-400 text-amber-900 hover:bg-amber-100">
                    <Link href={`/groups/${groupId}/settings`}>
                      Configurar grupo →
                    </Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p>
              Este grupo está aguardando aprovação da equipe Convoca. As funcionalidades ficam
              disponíveis assim que for aprovado — normalmente em até 24h.
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const message = getGroupBlockedMessage(status, reason);
  if (!message) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-6">
      <AlertTitle>Status do grupo: {getGroupStatusLabel(status)}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
