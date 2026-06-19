"use client";

import { useState } from "react";
import { Shuffle, Zap } from "lucide-react";

/**
 * Demonstração interativa do sorteio de times
 * Mostra como a IA balanceia os times baseado em ratings
 */
export default function TeamDrawDemo() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const players = [
    { name: "Pedro C.", rating: 9.2, position: "Goleiro" },
    { name: "Lucas S.", rating: 8.8, position: "Linha" },
    { name: "João P.", rating: 7.5, position: "Linha" },
    { name: "Marcos A.", rating: 8.1, position: "Linha" },
    { name: "Carlos M.", rating: 6.9, position: "Linha" },
    { name: "Rafael G.", rating: 9.0, position: "Goleiro" },
    { name: "Bruno L.", rating: 8.5, position: "Linha" },
    { name: "Diego S.", rating: 7.8, position: "Linha" },
    { name: "Felipe R.", rating: 8.0, position: "Linha" },
    { name: "André K.", rating: 7.2, position: "Linha" },
  ];

  const [teamA, setTeamA] = useState<typeof players>([]);
  const [teamB, setTeamB] = useState<typeof players>([]);

  const handleDraw = () => {
    setIsDrawing(true);
    setHasDrawn(false);

    setTimeout(() => {
      // Simula sorteio balanceado
      const goalkeepers = players.filter((p) => p.position === "Goleiro");
      const linePlayers = players.filter((p) => p.position === "Linha");

      // Distribui goleiros
      const newTeamA = [goalkeepers[0]];
      const newTeamB = [goalkeepers[1]];

      // Ordena linha players por rating (descendente) e distribui alternadamente
      const sortedLine = [...linePlayers].sort((a, b) => b.rating - a.rating);

      sortedLine.forEach((player, i) => {
        if (i % 2 === 0) {
          newTeamA.push(player);
        } else {
          newTeamB.push(player);
        }
      });

      setTeamA(newTeamA);
      setTeamB(newTeamB);
      setIsDrawing(false);
      setHasDrawn(true);
    }, 2000);
  };

  const teamARating =
    teamA.length > 0 ? (teamA.reduce((acc, p) => acc + p.rating, 0) / teamA.length).toFixed(1) : "0.0";
  const teamBRating =
    teamB.length > 0 ? (teamB.reduce((acc, p) => acc + p.rating, 0) / teamB.length).toFixed(1) : "0.0";

  return (
    <div className="w-full">
      {!hasDrawn ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1ABC9C]/10 border border-[#1ABC9C]/30 rounded-full text-sm font-semibold text-[#1ABC9C] mb-4">
              <Zap className="h-4 w-4" />
              IA Balanceamento Automático
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sorteio Inteligente de Times</h3>
            <p className="text-[#B0B0B0] max-w-md mx-auto">
              Algoritmo considera ratings, posições e histórico para criar times equilibrados
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-2xl mx-auto mb-6">
            {players.map((player, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
              >
                <div className="text-xs text-[#B0B0B0] mb-1">{player.position === "Goleiro" ? "🥅" : "⚽"}</div>
                <div className="text-sm font-semibold text-white mb-1">{player.name}</div>
                <div className="text-xs">
                  <span className="text-[#FFD700]">★</span>
                  <span className="text-[#B0B0B0]"> {player.rating}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleDraw}
            disabled={isDrawing}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1ABC9C] to-[#16a085] text-white font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDrawing ? (
              <>
                <Shuffle className="h-5 w-5 animate-spin" />
                Sorteando...
              </>
            ) : (
              <>
                <Shuffle className="h-5 w-5" />
                Sortear Times
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-sm font-semibold text-green-400 mb-2">
              ✅ Times Sorteados
            </div>
            <p className="text-sm text-[#B0B0B0]">
              Times balanceados com diferença de apenas {Math.abs(parseFloat(teamARating) - parseFloat(teamBRating)).toFixed(1)} pontos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#2E86AB]/10 border border-[#2E86AB]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-[#2E86AB]">Time A</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#B0B0B0]">Rating Médio</span>
                  <span className="px-3 py-1 bg-[#2E86AB]/20 rounded-full text-sm font-bold text-[#2E86AB]">
                    {teamARating}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {teamA.map((player, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{player.position === "Goleiro" ? "🥅" : "⚽"}</span>
                      <span className="text-sm font-semibold text-white">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#FFD700]">★</span>
                      <span className="text-sm text-white">{player.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1ABC9C]/10 border border-[#1ABC9C]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-[#1ABC9C]">Time B</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#B0B0B0]">Rating Médio</span>
                  <span className="px-3 py-1 bg-[#1ABC9C]/20 rounded-full text-sm font-bold text-[#1ABC9C]">
                    {teamBRating}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {teamB.map((player, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{player.position === "Goleiro" ? "🥅" : "⚽"}</span>
                      <span className="text-sm font-semibold text-white">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#FFD700]">★</span>
                      <span className="text-sm text-white">{player.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setHasDrawn(false)}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              🔄 Sortear Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
