"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertTriangle } from "lucide-react";

interface RSVPCardProps {
  eventId?: string | number;
  userId?: string | number;
  currentStatus?: "yes" | "no" | "waitlist";
  currentRole?: "gk" | "line";
  confirmedCount: number;
  maxPlayers: number;
  waitlistCount: number;
  onRSVP: (status: "yes" | "no", role: "gk" | "line") => Promise<void>;
}

export function RSVPCard({
  eventId,
  userId,
  currentStatus,
  currentRole = "line",
  confirmedCount,
  maxPlayers,
  waitlistCount,
  onRSVP,
}: RSVPCardProps) {
  const [role, setRole] = useState<"gk" | "line">(currentRole);
  const [loading, setLoading] = useState(false);

  const handleRSVP = async (status: "yes" | "no") => {
    setLoading(true);
    try {
      await onRSVP(status, role);
    } finally {
      setLoading(false);
    }
  };

  const isFull = confirmedCount >= maxPlayers;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar Presença</CardTitle>
        <CardDescription>
          {confirmedCount} de {maxPlayers} confirmados
          {waitlistCount > 0 && ` • ${waitlistCount} na fila de espera`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sua posição:</label>
          <Select value={role} onValueChange={(v) => setRole(v as "gk" | "line")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="gk">Goleiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentStatus && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status atual:</span>
            <Badge variant={currentStatus === "yes" ? "default" : currentStatus === "waitlist" ? "secondary" : "outline"}>
              {currentStatus === "yes" ? "Confirmado" : currentStatus === "waitlist" ? "Fila de espera" : "Não vou"}
            </Badge>
          </div>
        )}

        {isFull && currentStatus !== "yes" && (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Jogo completo. Você será adicionado à fila de espera.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => handleRSVP("yes")}
          disabled={loading}
          className="flex-1"
          variant={currentStatus === "yes" ? "default" : "outline"}
        >
          {loading ? "Confirmando..." : "Confirmar"}
        </Button>
        <Button
          onClick={() => handleRSVP("no")}
          disabled={loading}
          variant={currentStatus === "no" ? "destructive" : "outline"}
          className="flex-1"
        >
          Não vou
        </Button>
      </CardFooter>
    </Card>
  );
}
