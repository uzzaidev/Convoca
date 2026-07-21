"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { PitchBackground } from "@/components/ui/pitch-background";

const SAFE_PREFIXES = ["/groups/", "/events/", "/dashboard", "/profile", "/settings"];

function isSafeCallback(url: string | null): url is string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return false;
  return SAFE_PREFIXES.some((p) => url.startsWith(p));
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
        setIsLoading(false);
        return;
      }

      router.push(isSafeCallback(callbackUrl) ? callbackUrl : "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  }

  const signupHref = callbackUrl
    ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/signup";

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[1.1fr_1fr]">
      {/* ───────── Left: pitch hero ───────── */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0">
          <PitchBackground height="100%" style={{ height: "100%" }} />
        </div>
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md font-display text-2xl"
              style={{
                background: "hsl(var(--navy))",
                color: "hsl(var(--pitch-glow))",
                letterSpacing: "0.02em",
              }}
            >
              C
            </div>
            <div>
              <div className="font-display text-2xl tracking-display leading-none">CONVOCA</div>
              <div className="text-[11px] uppercase tracking-eyebrow opacity-75">
                Pelada Manager
              </div>
            </div>
          </div>

          {/* Big tagline */}
          <div>
            <h2
              className="font-display tracking-scoreboard"
              style={{ fontSize: "clamp(36px, 4.2vw, 60px)", lineHeight: 0.95 }}
            >
              CONVOQUE A GALERA.
              <br />
              JOGUE A PELADA.
              <br />
              VENÇA A SEMANA.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed opacity-90">
              Marque jogos, confirme presença, sorteie times equilibrados e
              acompanhe rankings da turma — tudo num só lugar.
            </p>
          </div>

          {/* Value props */}
          <div className="flex flex-wrap gap-6">
            {[
              { title: "Times", subtitle: "sorteio equilibrado" },
              { title: "Rankings", subtitle: "artilheiros + MVPs" },
              { title: "Carteira", subtitle: "cobrar e dividir" },
            ].map((item) => (
              <div key={item.title}>
                <div className="font-display text-3xl tracking-display leading-none">
                  {item.title}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-eyebrow opacity-75">
                  {item.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───────── Right: form ───────── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md font-display text-xl"
              style={{
                background: "hsl(var(--navy))",
                color: "hsl(var(--pitch-glow))",
                letterSpacing: "0.02em",
              }}
            >
              C
            </div>
            <div className="font-display text-xl tracking-display leading-none">CONVOCA</div>
          </div>

          <span className="inline-flex items-center rounded-full bg-pitch-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-eyebrow text-pitch">
            Bem-vindo de volta
          </span>

          <h1 className="mt-3 font-display text-4xl tracking-display sm:text-5xl">
            BORA JOGAR?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse sua conta pra confirmar a próxima pelada.
          </p>

          {message && (
            <div className="mt-4 rounded-md border border-pitch/30 bg-pitch/10 px-3 py-2 text-sm text-pitch">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  Senha
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-pitch hover:underline"
                >
                  esqueci minha senha
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar e convocar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">Primeira vez por aqui?</p>
            <Link
              href={signupHref}
              className="text-sm font-semibold text-pitch hover:underline"
            >
              Criar minha conta
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignInContent />
    </Suspense>
  );
}
