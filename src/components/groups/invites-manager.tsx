"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Copy, Trash2, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Invite = {
  id: string;
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
  created_by_name: string | null;
};

type InvitesManagerProps = {
  groupId: string;
  groupName: string;
  initialInvites: Invite[];
};

export function InvitesManager({ groupId, groupName, initialInvites }: InvitesManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({
    maxUses: "",
    expiresAt: "",
  });

  const handleCreateInvite = async () => {
    setIsCreating(true);

    try {
      const body: Record<string, string | number> = {};
      if (newInvite.maxUses) {
        body.maxUses = parseInt(newInvite.maxUses);
      }
      if (newInvite.expiresAt) {
        body.expiresAt = new Date(newInvite.expiresAt).toISOString();
      }

      const response = await fetch(`/api/groups/${groupId}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar convite");
      }

      setInvites([data.invite, ...invites]);
      setIsDialogOpen(false);
      setNewInvite({ maxUses: "", expiresAt: "" });

      toast({
        title: "Convite criado!",
        description: `Código: ${data.invite.code}`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao criar convite",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    setIsDeleting(inviteId);

    try {
      const response = await fetch(`/api/groups/${groupId}/invites/${inviteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao deletar convite");
      }

      setInvites(invites.filter((inv) => inv.id !== inviteId));

      toast({
        title: "Convite deletado!",
        description: "O convite foi removido com sucesso.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao deletar convite",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const copyInviteUrl = (code: string) => {
    const inviteUrl = `${window.location.origin}/groups/join?code=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copiado!",
      description: "O link do convite foi copiado para a área de transferência.",
    });
  };

  const shareViaWhatsApp = (code: string) => {
    const inviteUrl = `${window.location.origin}/groups/join?code=${code}`;
    const message = `Você foi convidado para o grupo "${groupName}" no Peladeiros! Acesse: ${inviteUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Convites do Grupo</CardTitle>
            <CardDescription>
              Gerencie os códigos de convite para o grupo
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Convite</DialogTitle>
                <DialogDescription>
                  Configure as opções do convite (ambos opcionais)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Limite de Usos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={newInvite.maxUses}
                    onChange={(e) =>
                      setNewInvite({ ...newInvite, maxUses: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Data de Expiração</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newInvite.expiresAt}
                    onChange={(e) =>
                      setNewInvite({ ...newInvite, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateInvite}
                  disabled={isCreating}
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum convite criado ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-mono font-semibold">
                    {invite.code}
                  </TableCell>
                  <TableCell>
                    {invite.used_count}
                    {invite.max_uses ? ` / ${invite.max_uses}` : " / ∞"}
                  </TableCell>
                  <TableCell>
                    {invite.expires_at
                      ? format(new Date(invite.expires_at), "Pp", { locale: ptBR })
                      : "Nunca"}
                  </TableCell>
                  <TableCell>{invite.created_by_name || "N/A"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteUrl(invite.code)}
                      title="Copiar link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareViaWhatsApp(invite.code)}
                      title="Compartilhar no WhatsApp"
                    >
                      <Share2 className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.id)}
                      disabled={isDeleting === invite.id}
                      title="Deletar convite"
                    >
                      {isDeleting === invite.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
