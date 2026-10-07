"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const steps = [
  {
    title: "Parlez-nous de vous",
    subtitle:
      "Quelques informations pour personnaliser votre expérience FinAI.",
  },
  {
    title: "Vos revenus",
    subtitle:
      "Aidez FinAI à comprendre votre situation financière.",
  },
  {
    title: "Vos dépenses",
    subtitle:
      "Une estimation suffit, vous pourrez modifier ces données plus tard.",
  },
  {
    title: "Vos objectifs",
    subtitle:
      "Quels sont vos objectifs financiers ? Sélectionnez une ou plusieurs réponses.",
  },
];

const situations = [
  "Salarié(e)",
  "Indépendant(e)",
  "Étudiant(e)",
  "Sans emploi",
  "Autre",
];

const goals = [
  "Mieux gérer mon budget",
  "Réduire mes dépenses",
  "Épargner davantage",
  "Atteindre un objectif d’épargne",
  "Investir",
  "Rembourser mes dettes",
  "Constituer une épargne de sécurité",
  "Améliorer ma situation financière",
  "Préparer un projet",
  "Autre",
];

type FormState = {
  firstName: string;
  situation: string;
  monthlyIncome: string;
  housing: string;
  food: string;
  transport: string;
  subscriptions: string;
  otherExpenses: string;
  goals: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    situation: "",
    monthlyIncome: "",
    housing: "",
    food: "",
    transport: "",
    subscriptions: "",
    otherExpenses: "",
    goals: [],
  });

  function updateField(
    field: keyof Omit<FormState, "goals">,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleGoal(goal: string) {
    setForm((current) => ({
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal],
    }));
  }

  function validateCurrentStep(): boolean {
    setError(null);

    if (step === 0) {
      if (!form.firstName.trim()) {
        setError("Veuillez renseigner votre prénom.");
        return false;
      }

      if (!form.situation) {
        setError("Veuillez sélectionner votre situation.");
        return false;
      }
    }

    if (step === 1) {
      if (
        !form.monthlyIncome ||
        Number(form.monthlyIncome) < 0
      ) {
        setError(
          "Veuillez renseigner vos revenus mensuels.",
        );
        return false;
      }
    }

    if (step === 2) {
      const expenses = [
        form.housing,
        form.food,
        form.transport,
        form.subscriptions,
        form.otherExpenses,
      ];

      if (
        expenses.some(
          (value) =>
            value !== "" &&
            (Number.isNaN(Number(value)) ||
              Number(value) < 0),
        )
      ) {
        setError(
          "Les dépenses ne peuvent pas être négatives.",
        );
        return false;
      }
    }

    if (step === 3) {
      if (form.goals.length === 0) {
        setError(
          "Sélectionnez au moins un objectif.",
        );
        return false;
      }
    }

    return true;
  }

  async function finishOnboarding() {
    setError(null);

    if (!user) {
      setError(
        "Votre session utilisateur est introuvable. Veuillez vous reconnecter.",
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Sauvegarde des réponses du questionnaire.
       * Pour le moment, elles sont conservées localement.
       */
      localStorage.setItem(
        "finai-onboarding",
        JSON.stringify(form),
      );

      /*
       * Création du compte bancaire principal.
       */
      const response = await fetch(
        `${API_URL}/users/${user.id}/accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: "Compte principal",
            account_type: "checking",
          }),
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.detail ??
            `Impossible de créer votre compte bancaire. (${response.status})`,
        );
      }

      const account = await response.json();

      if (account?.id) {
        localStorage.setItem(
          "finai-account-id",
          String(account.id),
        );
      }

      localStorage.setItem(
        "finai-onboarding-completed",
        "true",
      );

      /*
       * On envoie l'utilisateur vers son espace.
       */
      router.replace("/accounts");
    } catch (err) {
      console.error(
        "Erreur lors de la finalisation de l'onboarding :",
        err,
      );

      if (
        err instanceof TypeError &&
        err.message === "Failed to fetch"
      ) {
        setError(
          "Impossible de contacter le serveur FinAI. Vérifiez que l'API FastAPI est bien démarrée sur le port 8000.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur est survenue.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    void finishOnboarding();
  }

  function previousStep() {
    if (saving) {
      return;
    }

    setError(null);

    if (step > 0) {
      setStep((current) => current - 1);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#062c24] text-lg font-bold text-white">
            F
          </div>

          <div>
            <div className="text-lg font-bold text-[#071f1a]">
              FinAI
            </div>

            <div className="text-xs font-medium tracking-[0.18em] text-[#78908a]">
              FINANCE INTELLIGENTE
            </div>
          </div>
        </div>

        {/* PROGRESSION */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between text-sm text-[#78908a]">
            <span>
              Étape {step + 1} sur {steps.length}
            </span>

            <span>
              {Math.round(
                ((step + 1) / steps.length) * 100,
              )}
              %
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#dfe7e3]">
            <div
              className="h-full rounded-full bg-[#08aa83] transition-all duration-300"
              style={{
                width: `${
                  ((step + 1) / steps.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* CARD */}
        <section className="rounded-[32px] bg-white p-7 shadow-[0_15px_50px_rgba(0,0,0,0.06)] sm:p-10">
          {/* HEADER */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#08a884]">
              Votre profil FinAI
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#071f1a] sm:text-4xl">
              {steps[step].title}
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-[#78908a]">
              {steps[step].subtitle}
            </p>
          </div>

          {/* ÉTAPE 1 */}
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#19332d]">
                  Comment vous appelez-vous ?
                </label>

                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField(
                      "firstName",
                      event.target.value,
                    )
                  }
                  placeholder="Votre prénom"
                  className="w-full rounded-2xl border border-[#dce5e1] bg-[#fbfcfb] px-5 py-4 text-base outline-none transition focus:border-[#08aa83] focus:ring-4 focus:ring-[#08aa83]/10"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-[#19332d]">
                  Quelle est votre situation ?
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {situations.map((item) => {
                    const selected =
                      form.situation === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          updateField(
                            "situation",
                            item,
                          )
                        }
                        className={`rounded-2xl border px-5 py-4 text-left font-medium transition ${
                          selected
                            ? "border-[#08aa83] bg-[#eaf9f4] text-[#078665]"
                            : "border-[#dce5e1] bg-white text-[#526963] hover:border-[#a9c9bf]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 */}
          {step === 1 && (
            <div className="space-y-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#19332d]">
                  Revenus mensuels nets
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={form.monthlyIncome}
                    onChange={(event) =>
                      updateField(
                        "monthlyIncome",
                        event.target.value,
                      )
                    }
                    placeholder="Votre revenu mensuel net"
                    className="w-full rounded-2xl border border-[#dce5e1] bg-[#fbfcfb] px-5 py-4 pr-16 text-lg outline-none transition focus:border-[#08aa83] focus:ring-4 focus:ring-[#08aa83]/10"
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-semibold text-[#78908a]">
                    €
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f1f8f5] p-5">
                <div className="text-sm font-semibold text-[#19332d]">
                  Pourquoi cette information ?
                </div>

                <p className="mt-2 text-sm leading-6 text-[#70857f]">
                  FinAI utilisera cette donnée pour
                  calculer votre capacité d'épargne
                  et vous proposer des recommandations
                  adaptées.
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 */}
          {step === 2 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["housing", "Logement"],
                ["food", "Alimentation"],
                ["transport", "Transport"],
                ["subscriptions", "Abonnements"],
                ["otherExpenses", "Autres dépenses"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-2 block text-sm font-semibold text-[#19332d]">
                    {label}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={
                        form[
                          field as keyof FormState
                        ] as string
                      }
                      onChange={(event) =>
                        updateField(
                          field as keyof Omit<
                            FormState,
                            "goals"
                          >,
                          event.target.value,
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-2xl border border-[#dce5e1] bg-[#fbfcfb] px-5 py-4 pr-12 outline-none transition focus:border-[#08aa83] focus:ring-4 focus:ring-[#08aa83]/10"
                    />

                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#78908a]">
                      €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ÉTAPE 4 */}
          {step === 3 && (
            <div>
              <p className="mb-5 text-sm text-[#78908a]">
                Vous pouvez sélectionner plusieurs
                objectifs.
              </p>

              <div className="grid gap-3">
                {goals.map((goal) => {
                  const selected =
                    form.goals.includes(goal);

                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() =>
                        toggleGoal(goal)
                      }
                      className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left font-medium transition ${
                        selected
                          ? "border-[#08aa83] bg-[#eaf9f4] text-[#078665]"
                          : "border-[#dce5e1] bg-white text-[#526963] hover:border-[#a9c9bf]"
                      }`}
                    >
                      <span>{goal}</span>

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          selected
                            ? "border-[#08aa83] bg-[#08aa83] text-white"
                            : "border-[#cbd8d4]"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ERREUR */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#edf1ef] pt-7">
            <button
              type="button"
              onClick={previousStep}
              disabled={step === 0 || saving}
              className="rounded-2xl px-5 py-3 font-semibold text-[#60756f] transition hover:bg-[#f3f6f4] disabled:invisible"
            >
              ← Retour
            </button>

            <button
              type="button"
              onClick={nextStep}
              disabled={saving}
              className="rounded-2xl bg-[#08aa83] px-7 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(8,170,131,0.2)] transition hover:bg-[#079775] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Enregistrement..."
                : step === steps.length - 1
                  ? "Terminer"
                  : "Continuer"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}