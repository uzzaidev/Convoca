"use client";

import { useEffect } from "react";

const TOUR_KEY = "convoca_event_tour_v1";

type Props = {
  isAdmin: boolean;
};

export function EventTour({ isAdmin }: Props) {
  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return;

    const runTour = async () => {
      const { driver } = await import("driver.js");

      const adminSteps = [
        {
          element: "[data-tour='event-info']",
          popover: {
            title: "📋 Detalhes da Pelada",
            description:
              "Data, local e vagas. A barra mostra quantos já confirmaram em relação ao máximo.",
            side: "bottom" as const,
            align: "start" as const,
          },
        },
        {
          element: "[data-tour='event-tabs']",
          popover: {
            title: "⚙️ Painel do Admin",
            description:
              "Confirme jogadores, faça check-in no campo, sorteie os times e registre gols em Ao Vivo.",
            side: "top" as const,
            align: "start" as const,
          },
        },
      ];

      const memberSteps = [
        {
          element: "[data-tour='event-info']",
          popover: {
            title: "📋 Detalhes da Pelada",
            description:
              "Data, local e vagas disponíveis. Confirme sua presença para garantir sua vaga.",
            side: "bottom" as const,
            align: "start" as const,
          },
        },
        {
          element: "[data-tour='event-tabs']",
          popover: {
            title: "🗂️ Abas da Pelada",
            description:
              "Confirme sua presença em Jogadores, veja os times após o sorteio e as stats no final.",
            side: "top" as const,
            align: "start" as const,
          },
        },
      ];

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
        steps: isAdmin ? adminSteps : memberSteps,
      });

      const timer = setTimeout(() => {
        if (document.querySelector("[data-tour='event-info']")) {
          driverObj.drive();
        }
      }, 900);

      return () => clearTimeout(timer);
    };

    void runTour();
  }, [isAdmin]);

  return null;
}
