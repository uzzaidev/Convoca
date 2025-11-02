"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserMinus, Shield, Loader2, UserPlus, Search } from "lucide-react";
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

type SearchUser = {
  id: string;
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

  // Add member states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Create user states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(null);

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

  const handleSearchUsers = async () => {
    if (searchQuery.length < 3) {
      toast({
        title: "Digite mais caracteres",
        description: "Digite pelo menos 3 caracteres para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar usuários");
      }

      // Filter out users who are already members
      const memberIds = new Set(members.map((m) => m.user_id));
      const filteredUsers = data.users.filter(
        (u: SearchUser) => !memberIds.has(u.id)
      );

      setSearchResults(filteredUsers);

      // If no users found and search query looks like an email, offer to create user
      if (filteredUsers.length === 0 && searchQuery.includes("@")) {
        // No results, but valid email format - we'll show create option in UI
        // Don't show toast, let the UI handle it
      } else if (filteredUsers.length === 0) {
        toast({
          title: "Nenhum usuário encontrado",
          description: "Digite um email válido para criar um novo usuário",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar usuários",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar membro");
      }

      // Add new member to the list
      const newMember: Member = {
        id: data.member.id,
        user_id: data.member.user_id,
        role: data.member.role,
        joined_at: data.member.joined_at,
        name: data.member.name,
        email: data.member.email,
      };

      setMembers([...members, newMember]);

      // Remove from search results
      setSearchResults(searchResults.filter((u) => u.id !== userId));

      // Clear search if no more results
      if (searchResults.length === 1) {
        setSearchQuery("");
        setSearchResults([]);
      }

      toast({
        title: "Membro adicionado!",
        description: `${data.member.name} foi adicionado ao grupo.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao adicionar membro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleOpenCreateUserDialog = () => {
    setNewUserEmail(searchQuery);
    setNewUserName("");
    setNewUserPassword("");
    setShowCreateUserDialog(true);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast({
        title: "Campos obrigatórios",
        description: "Email e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/members/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          defaultPassword: newUserPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar usuário");
      }

      // Add new member to the list
      const newMember: Member = {
        id: data.member.id,
        user_id: data.member.user_id,
        role: data.member.role,
        joined_at: data.member.joined_at,
        name: data.member.name,
        email: data.member.email,
      };

      setMembers([...members, newMember]);

      // Store the temporary password to show to admin
      setCreatedUserPassword(data.temporaryPassword);

      // Clear search
      setSearchQuery("");
      setSearchResults([]);
      setShowCreateUserDialog(false);

      toast({
        title: "Usuário criado e adicionado!",
        description: `${data.member.name} foi criado e adicionado ao grupo.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao criar usuário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Membro</CardTitle>
          <CardDescription>
            Busque usuários por email e adicione-os ao grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Digite o email do usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchUsers();
                }
              }}
            />
            <Button
              onClick={handleSearchUsers}
              disabled={isSearching || searchQuery.length < 3}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          disabled={isAddingMember}
                        >
                          {isAddingMember ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {searchResults.length === 0 && searchQuery.includes("@") && !isSearching && (
            <div className="border rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum usuário encontrado com o email <strong>{searchQuery}</strong>
              </p>
              <Button onClick={handleOpenCreateUserDialog} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Novo Usuário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário e adicione-o ao grupo automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="exemplo@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome do jogador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Senha (opcional - padrão: Peladeiros2024!)
              </Label>
              <Input
                id="password"
                type="text"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Deixe em branco para usar a padrão"
              />
              <p className="text-xs text-muted-foreground">
                O usuário poderá alterar a senha após o primeiro acesso
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateUserDialog(false)}
              disabled={isCreatingUser}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar e Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show temporary password dialog */}
      <AlertDialog
        open={!!createdUserPassword}
        onOpenChange={() => setCreatedUserPassword(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuário Criado com Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Anote a senha temporária abaixo e envie para o jogador. Ele poderá
              alterá-la após o primeiro acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="text-sm font-medium mb-2">Senha Temporária:</p>
            <p className="text-lg font-mono font-bold">{createdUserPassword}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCreatedUserPassword(null)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
