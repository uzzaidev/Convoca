"use client";

import { Trophy, Target, Star, TrendingUp } from "lucide-react";

/**
 * Showcase de estatísticas e rankings
 * Mostra como o sistema de votação e rankings funciona
 */
export default function StatsShowcase() {
  const rankings = [
    {
      position: 1,
      name: "Pedro Costa",
      goals: 24,
      assists: 12,
      mvps: 8,
      matches: 20,
      trend: "up",
    },
    {
      position: 2,
      name: "Lucas Silva",
      goals: 22,
      assists: 15,
      mvps: 6,
      matches: 20,
      trend: "up",
    },
    {
      position: 3,
      name: "João Santos",
      goals: 18,
      assists: 10,
      mvps: 5,
      matches: 19,
      trend: "same",
    },
  ];

  const stats = [
    {
      icon: Trophy,
      label: "Total de Jogos",
      value: "48",
      color: "#FFD700",
    },
    {
      icon: Target,
      label: "Gols Marcados",
      value: "312",
      color: "#1ABC9C",
    },
    {
      icon: Star,
      label: "MVPs",
      value: "48",
      color: "#2E86AB",
    },
    {
      icon: TrendingUp,
      label: "Presença Média",
      value: "85%",
      color: "#16a085",
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-[#B0B0B0]">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Rankings Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1ABC9C]/10 to-[#2E86AB]/10 px-6 py-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FFD700]" />
            Ranking de Jogadores
          </h3>
        </div>

        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 px-4 py-2 text-xs font-semibold text-[#B0B0B0] border-b border-white/5">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Jogador</div>
            <div className="text-center">⚽ Gols</div>
            <div className="text-center">🎯 Assists</div>
            <div className="text-center">⭐ MVPs</div>
            <div className="text-center">📊 Jogos</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2 mt-2">
            {rankings.map((player) => (
              <div
                key={player.position}
                className={`grid grid-cols-7 gap-4 items-center px-4 py-3 rounded-xl transition-all hover:bg-white/5 ${
                  player.position === 1
                    ? "bg-[#FFD700]/10 border border-[#FFD700]/30"
                    : "bg-white/5 border border-white/5"
                }`}
              >
                <div className="col-span-1 flex items-center gap-2">
                  {player.position === 1 && <span className="text-2xl">👑</span>}
                  {player.position === 2 && <span className="text-xl">🥈</span>}
                  {player.position === 3 && <span className="text-xl">🥉</span>}
                  <span
                    className={`text-lg font-bold ${
                      player.position === 1 ? "text-[#FFD700]" : "text-white"
                    }`}
                  >
                    {player.position}º
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        player.position === 1
                          ? "bg-[#FFD700]/20 text-[#FFD700]"
                          : "bg-[#1ABC9C]/20 text-[#1ABC9C]"
                      }`}
                    >
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{player.name}</div>
                      <div className="flex items-center gap-1 text-xs text-[#B0B0B0]">
                        {player.trend === "up" && (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span className="text-green-400">+2</span>
                          </>
                        )}
                        {player.trend === "same" && <span>—</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center font-bold text-white">{player.goals}</div>
                <div className="text-center font-bold text-white">{player.assists}</div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-sm font-bold text-[#FFD700]">
                    ⭐ {player.mvps}
                  </span>
                </div>
                <div className="text-center text-[#B0B0B0]">{player.matches}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 text-center">
          <button className="text-sm text-[#1ABC9C] font-semibold hover:text-[#16a085] transition-colors">
            Ver Ranking Completo →
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#1ABC9C]/10 to-[#2E86AB]/10 border border-[#1ABC9C]/30 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-[#1ABC9C] mb-3">🔥 Artilheiro do Mês</h4>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#1ABC9C]/20 flex items-center justify-center text-xl font-bold text-[#1ABC9C]">
              PC
            </div>
            <div>
              <div className="text-xl font-bold text-white">Pedro Costa</div>
              <div className="text-sm text-[#B0B0B0]">12 gols em Março</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#FFD700]/10 to-orange-500/10 border border-[#FFD700]/30 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-[#FFD700] mb-3">⭐ Maior Pontuação</h4>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-xl font-bold text-[#FFD700]">
              LS
            </div>
            <div>
              <div className="text-xl font-bold text-white">Lucas Silva</div>
              <div className="text-sm text-[#B0B0B0]">8 MVPs em 2025</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
