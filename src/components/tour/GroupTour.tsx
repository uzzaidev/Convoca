"use client";

import { useEffect } from "react";
import "driver.js/dist/driver.css";
import "./group-tour-theme.css";

const TOUR_KEY = "convoca_group_tour_v1";

type Props = {
  isAdmin: boolean;
};

export function GroupTour({ isAdmin }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const runTour = async () => {
      const { driver } = await import("driver.js");

      const adminSteps = [
        {
          element: "[data-tour='criar-evento']",
          popover: {
            title: "📅 Criar Pelada",
            description:
              "Agende uma nova partida: defina data, local e número máximo de jogadores.",
            side: "bottom" as const,
            align: "end" as const,
          },
        },
        {
          element: "[data-tour='configuracoes']",
          popover: {
            title: "⚙️ Configurações",
            description:
              "Convide membros via link, gerencie o grupo e ajuste pontuação e sorteio.",
            side: "bottom" as const,
            align: "end" as const,
          },
        },
        {
          element: "[data-tour='proximas-partidas']",
          popover: {
            title: "🗓️ Próximas Partidas",
            description:
              "Acompanhe as peladas agendadas e veja quantos jogadores já confirmaram.",
            side: "top" as const,
            align: "start" as const,
          },
        },
      ];

      const memberSteps = [
        {
          element: "[data-tour='proximas-partidas']",
          popover: {
            title: "🗓️ Próximas Partidas",
            description:
              "Veja as peladas agendadas e confirme sua presença com um clique.",
            side: "top" as const,
            align: "start" as const,
          },
        },
        {
          element: "[data-tour='rankings']",
          popover: {
            title: "🏆 Ranking",
            description:
              "Veja seu desempenho e compare com a galera do grupo.",
            side: "top" as const,
            align: "start" as const,
          },
        },
      ];

      const steps = isAdmin ? adminSteps : memberSteps;

      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo →",
        prevBtnText: "← Anterior",
        doneBtnText: "Entendido!",
        popoverClass: "convoca-tour-popover",
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, "1");
        },
        steps,
      });

      // Aguarda DOM estar estável após hydration
      const timer = setTimeout(() => {
        const firstSelector = steps[0].element;
        if (document.querySelector(firstSelector)) {
          driverObj.drive();
        }
      }, 900);

      return () => clearTimeout(timer);
    };

    void runTour();
  }, [isAdmin]);

  return null;
}
