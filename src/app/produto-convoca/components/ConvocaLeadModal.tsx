"use client";

import { useState } from "react";
import { X } from "lucide-react";

/**
 * Modal de captura de leads para o Convoca
 * Permite usuários manifestarem interesse no app
 */
export default function ConvocaLeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    groupSize: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de envio (substituir por API real)
    setTimeout(() => {
      setSubmitStatus("success");
      setIsSubmitting(false);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus("idle");
        setFormData({ name: "", email: "", whatsapp: "", groupSize: "" });
      }, 2000);
    }, 1500);
  };

  return (
    <>
      {/* Botão de CTA */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1ABC9C] to-[#16a085] px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#1ABC9C]/50"
      >
        Quero o Convoca Grátis 🎉
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1C1C1C] rounded-3xl border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-[#B0B0B0]" />
            </button>

            {submitStatus === "success" ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#1ABC9C]/20 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Tudo certo!</h3>
                <p className="text-[#B0B0B0]">
                  Entraremos em contato em breve com acesso antecipado ao Convoca.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Garanta seu acesso antecipado
                </h3>
                <p className="text-[#B0B0B0] mb-6">
                  Preencha os dados abaixo e seja um dos primeiros a usar o Convoca gratuitamente.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#1ABC9C] transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">E-mail</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#1ABC9C] transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#1ABC9C] transition-colors"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Tamanho do seu grupo
                    </label>
                    <select
                      required
                      value={formData.groupSize}
                      onChange={(e) => setFormData({ ...formData, groupSize: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#1ABC9C] transition-colors"
                    >
                      <option value="" className="bg-[#1C1C1C]">
                        Selecione...
                      </option>
                      <option value="6-12" className="bg-[#1C1C1C]">
                        6-12 jogadores (Society)
                      </option>
                      <option value="13-20" className="bg-[#1C1C1C]">
                        13-20 jogadores
                      </option>
                      <option value="21+" className="bg-[#1C1C1C]">
                        21+ jogadores (Campo)
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-[#1ABC9C] to-[#16a085] text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Enviando..." : "Garantir Acesso Grátis"}
                  </button>
                </form>

                <p className="text-xs text-[#B0B0B0] text-center mt-4">
                  🔒 Seus dados estão seguros. Não fazemos spam.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
