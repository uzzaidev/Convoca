"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Shuffle, Trophy } from "lucide-react";

/**
 * Carrossel mostrando o fluxo completo de um evento no Convoca
 * Desde criação até resultado final
 */
export default function EventFlowCarousel() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Calendar,
      title: "Criar Evento",
      description: "Defina data, hora, local e valor",
      mockup: <CreateEventMockup />,
      color: "#1ABC9C",
    },
    {
      icon: Users,
      title: "Confirmações",
      description: "Jogadores confirmam em 1 clique",
      mockup: <RSVPMockup />,
      color: "#2E86AB",
    },
    {
      icon: Shuffle,
      title: "Sorteio de Times",
      description: "IA balanceia times automaticamente",
      mockup: <TeamDrawMockup />,
      color: "#FFD700",
    },
    {
      icon: Trophy,
      title: "Resultado & Votação",
      description: "Registre gols e vote no MVP",
      mockup: <ResultsMockup />,
      color: "#16a085",
    },
  ];

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeStep === index
                  ? "bg-white/10 border border-white/20 scale-110"
                  : "bg-white/5 border border-white/5 hover:bg-white/10"
              }`}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: activeStep === index ? step.color : "#B0B0B0" }}
              />
              <span
                className={`text-sm font-semibold hidden sm:inline ${
                  activeStep === index ? "text-white" : "text-[#B0B0B0]"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active step content */}
      <div className="relative">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">{steps[activeStep].title}</h3>
          <p className="text-[#B0B0B0]">{steps[activeStep].description}</p>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-[#1C1C1C]/50 p-6 min-h-[400px] flex items-center justify-center">
          {steps[activeStep].mockup}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1ABC9C] to-[#2E86AB] transition-all duration-4000 ease-linear"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Mockup Components
function CreateEventMockup() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <label className="block text-xs font-semibold text-[#B0B0B0] mb-2">Nome do Evento</label>
        <div className="bg-white/5 rounded-lg px-3 py-2 text-white">Pelada Quinta-feira ⚽</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="block text-xs font-semibold text-[#B0B0B0] mb-2">Data</label>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm">15/03</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="block text-xs font-semibold text-[#B0B0B0] mb-2">Hora</label>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm">18:00</div>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <label className="block text-xs font-semibold text-[#B0B0B0] mb-2">Valor por pessoa</label>
        <div className="bg-white/5 rounded-lg px-3 py-2 text-white">R$ 15,00</div>
      </div>
      <button className="w-full py-3 bg-gradient-to-r from-[#1ABC9C] to-[#16a085] text-white font-bold rounded-xl">
        Criar Evento
      </button>
    </div>
  );
}

function RSVPMockup() {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-green-400">✅ Confirmados (18/20)</span>
        <span className="text-xs text-[#B0B0B0]">2 vagas</span>
      </div>
      {["Pedro Costa", "Lucas Silva", "Marcos Alves", "João Santos"].map((name, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1ABC9C]/30 flex items-center justify-center text-sm font-bold">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span className="text-sm text-white">{name}</span>
          </div>
          <span className="text-xs font-bold text-green-400">CONFIRMADO</span>
        </div>
      ))}
      <div className="border-t border-white/10 pt-3 mt-4">
        <span className="text-sm font-bold text-[#FFD700]">⏳ Lista de Espera (2)</span>
      </div>
    </div>
  );
}

function TeamDrawMockup() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#2E86AB]/10 border border-[#2E86AB]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[#2E86AB]">Time A</h4>
            <span className="text-xs bg-[#2E86AB]/20 px-2 py-1 rounded-full text-[#2E86AB]">
              Rating: 8.2
            </span>
          </div>
          <div className="space-y-2">
            {["Pedro C.", "Lucas S.", "João P.", "Marcos A.", "Carlos M."].map((name, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                <span className="text-[#2E86AB]">{i === 0 ? "🥅" : "⚽"}</span>
                <span className="text-white">{name}</span>
                {i === 1 && <span className="ml-auto text-xs text-[#FFD700]">★ 9.0</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1ABC9C]/10 border border-[#1ABC9C]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[#1ABC9C]">Time B</h4>
            <span className="text-xs bg-[#1ABC9C]/20 px-2 py-1 rounded-full text-[#1ABC9C]">
              Rating: 8.1
            </span>
          </div>
          <div className="space-y-2">
            {["Rafael G.", "Bruno L.", "Diego S.", "Felipe R.", "André K."].map((name, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                <span className="text-[#1ABC9C]">{i === 0 ? "🥅" : "⚽"}</span>
                <span className="text-white">{name}</span>
                {i === 2 && <span className="ml-auto text-xs text-[#FFD700]">★ 8.8</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <button className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm hover:bg-white/20 transition-colors">
          🔄 Re-sortear
        </button>
      </div>
    </div>
  );
}

function ResultsMockup() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="bg-gradient-to-r from-[#2E86AB]/20 to-[#1ABC9C]/20 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm font-bold text-[#2E86AB] mb-1">Time A</div>
            <div className="text-4xl font-bold text-white">3</div>
          </div>
          <span className="text-2xl text-[#B0B0B0]">×</span>
          <div className="text-center">
            <div className="text-sm font-bold text-[#1ABC9C] mb-1">Time B</div>
            <div className="text-4xl font-bold text-white">2</div>
          </div>
        </div>
        <div className="text-center text-xs text-[#B0B0B0]">Partida finalizada • 15/03 20:00</div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white mb-3">🏆 Votação MVP</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
            <span className="text-sm text-white">Pedro Costa</span>
            <div className="flex items-center gap-2">
              <span className="text-[#FFD700]">★★★★★</span>
              <span className="text-xs text-[#FFD700] font-bold">12 votos</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-sm text-white">Lucas Silva</span>
            <div className="flex items-center gap-2">
              <span className="text-[#FFD700]">★★★★☆</span>
              <span className="text-xs text-[#B0B0B0]">8 votos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
