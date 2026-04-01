export const systemRoleValues = ["user", "system_admin"] as const;
export type SystemRole = (typeof systemRoleValues)[number];

export const groupStatusValues = ["pending", "pending_payment", "active", "inactive", "rejected"] as const;
export type GroupStatus = (typeof groupStatusValues)[number];

export const groupRoleValues = ["admin", "member"] as const;
export type GroupRole = (typeof groupRoleValues)[number];

export function isGroupOperational(status: GroupStatus) {
  return status === "active";
}

export function getGroupStatusLabel(status: GroupStatus) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "pending_payment":
      return "Aguardando Pagamento";
    case "active":
      return "Ativo";
    case "inactive":
      return "Inativo";
    case "rejected":
      return "Reprovado";
  }
}

export function getGroupBlockedMessage(status: GroupStatus, reason?: string | null) {
  switch (status) {
    case "pending":
      return "Este grupo esta aguardando aprovacao do administrador.";
    case "pending_payment":
      return "Este grupo esta aguardando o pagamento da assinatura.";
    case "inactive":
      return reason
        ? `Este grupo esta inativo no momento. Motivo: ${reason}`
        : "Este grupo esta inativo no momento.";
    case "rejected":
      return reason
        ? `Este grupo foi reprovado. Motivo: ${reason}`
        : "Este grupo foi reprovado pelo administrador.";
    case "active":
      return null;
  }
}
