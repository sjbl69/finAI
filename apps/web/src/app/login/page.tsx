"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/accounts");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de vous connecter.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#071510]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">

          {/* Carte */}

          <div className="rounded-[28px] border border-[#e5ebe8] bg-white p-7 shadow-[0_20px_60px_rgba(7,21,16,0.06)] sm:p-9">

            {/* Logo */}

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06251c] text-lg font-bold text-white">
                F
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  FinAI
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa5a2]">
                  Finance intelligente
                </p>
              </div>
            </div>

            {/* Titre */}

            <div className="mb-7">
              <h1 className="text-3xl font-bold tracking-tight text-[#071510]">
                Connectez-vous
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#7b8783]">
                Retrouvez votre espace financier
                personnel.
              </p>
            </div>

            {/* Connexion */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#34423d]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="vous@exemple.com"
                  className="h-13 w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 text-sm outline-none transition placeholder:text-[#a8b1ae] focus:border-[#00a878] focus:bg-white focus:ring-4 focus:ring-[#00a878]/10"
                />
              </div>

              {/* Mot de passe */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#34423d]"
                  >
                    Mot de passe
                  </label>

                </div>

                <div className="relative">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Votre mot de passe"
                    className="h-13 w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 pr-12 text-sm outline-none transition placeholder:text-[#a8b1ae] focus:border-[#00a878] focus:bg-white focus:ring-4 focus:ring-[#00a878]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8b9692] transition hover:bg-[#f0f5f3] hover:text-[#34423d]"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>

                </div>
              </div>

              {/* Erreur */}

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Bouton */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-13 w-full items-center justify-center rounded-xl bg-[#00a878] text-sm font-bold text-white shadow-sm transition hover:bg-[#00966c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Connexion..."
                  : "Se connecter"}
              </button>

            </form>

            {/* Inscription */}

            <div className="mt-8 border-t border-[#edf1ef] pt-6 text-center">

              <p className="text-sm text-[#7b8783]">
                Vous n'avez pas encore de compte ?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-block text-sm font-bold text-[#087c5b] transition hover:text-[#005f46]"
              >
                Créer mon compte
              </Link>

            </div>

          </div>

          {/* Footer */}

          <p className="mt-6 text-center text-xs text-[#a0aaa7]">
            Vos données financières restent privées
            et sécurisées.
          </p>

        </div>
      </div>
    </main>
  );
}