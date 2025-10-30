"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { UserMinus, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Member = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  name: string;
  email: string;
};

type MembersManagerProps = {
  groupId: string;
  initialMembers: Member[];
  currentUserId: string;
};

export function MembersManager({
  groupId,
  initialMembers,
  currentUserId,
}: MembersManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const handleToggleRole = async (member: Member) => {
    setIsUpdating(member.user_id);

    const newRole = member.role === "admin" ? "member" : "admin";

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${member.user_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar role");
      }

      setMembers(
        members.map((m) =>
          m.user_id === member.user_id ? { ...m, role: newRole } : m
        )
      );

      toast({
        title: "Role atualizado!",
        description: `${member.name} agora é ${newRole === "admin" ? "administrador" : "membro"}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao atualizar role",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsUpdating(memberToRemove.user_id);

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${memberToRemove.user_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover membro");
      }

      setMembers(members.filter((m) => m.user_id !== memberToRemove.user_id));

      toast({
        title: "Membro removido!",
        description: `${memberToRemove.name} foi removido do grupo.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao remover membro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Membros do Grupo</CardTitle>
          <CardDescription>
            Gerencie os membros e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Entrou em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isLoading = isUpdating === member.user_id;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.role === "admin" ? "default" : "secondary"}
                      >
                        {member.role === "admin" ? "Admin" : "Membro"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.joined_at), "Pp", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(member)}
                        disabled={isCurrentUser || isLoading}
                        title={
                          member.role === "admin"
                            ? "Remover de admin"
                            : "Promover a admin"
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : member.role === "admin" ? (
                          <UserMinus className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                        disabled={isCurrentUser || isLoading}
                        title="Remover do grupo"
                      >
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro do grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {memberToRemove?.name} do grupo? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
