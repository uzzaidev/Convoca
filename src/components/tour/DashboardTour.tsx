"use client";

import { useEffect } from "react";

const TOUR_KEY = "convoca_dashboard_tour_v1";

type Props = {
  hasGroups: boolean;
};

export function DashboardTour({ hasGroups }: Props) {
  useEffect(() => {
    if (hasGroups) return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const runTour = async () => {
      const { driver } = await import("driver.js");

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
        steps: [
          {
            element: "[data-tour='criar-grupo']",
            popover: {
              title: "⚽ Criar seu grupo",
              description:
                "Crie um grupo para a sua galera: dê um nome, configure as regras e convide os amigos.",
              side: "bottom" as const,
              align: "end" as const,
            },
          },
          {
            element: "[data-tour='entrar-grupo']",
            popover: {
              title: "🔗 Entrar com convite",
              description:
                "Recebeu um link ou código pelo WhatsApp? Entre diretamente no grupo de um amigo.",
              side: "bottom" as const,
              align: "start" as const,
            },
          },
        ],
      });

      const timer = setTimeout(() => {
        if (document.querySelector("[data-tour='criar-grupo']")) {
          driverObj.drive();
        }
      }, 900);

      return () => clearTimeout(timer);
    };

    void runTour();
  }, [hasGroups]);

  return null;
}
