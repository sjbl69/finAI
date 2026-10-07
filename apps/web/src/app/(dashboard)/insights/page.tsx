"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/context/account-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Insight = {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  priority: number;
};

type Transaction = {
  id: number;
  amount: string;
  description: string;
  category: string;
  transaction_type: "income" | "expense";
};

export default function InsightsPage() {
  const {
    userId,
    account,
    accountId,
    loading: accountLoading,
    error: accountError,
  } = useAccount();

  const [insights, setInsights] =
    useState<Insight[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadInsights() {
    if (!accountId) {
      setInsights([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        insightsResponse,
        transactionsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/users/${userId}/accounts/${accountId}/insights`,
        ),

        fetch(
          `${API_URL}/users/${userId}/accounts/${accountId}/transactions`,
        ),
      ]);

      if (
        !insightsResponse.ok ||
        !transactionsResponse.ok
      ) {
        throw new Error(
          "Impossible de récupérer les données.",
        );
      }

      const insightsData: Insight[] =
        await insightsResponse.json();

      const transactionsData: Transaction[] =
        await transactionsResponse.json();

      setInsights(insightsData);
      setTransactions(
        transactionsData,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les analyses FinAI.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    loadInsights();
  }, [
    accountLoading,
    userId,
    accountId,
  ]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
          "income",
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Math.abs(
            Number(transaction.amount),
          ),
        0,
      );

    const expenses = transactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
          "expense",
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Math.abs(
            Number(transaction.amount),
          ),
        0,
      );

    const balance =
      income - expenses;

    const savingsRate =
      income > 0
        ? (balance / income) * 100
        : 0;

    return {
      income,
      expenses,
      balance,
      savingsRate,
    };
  }, [transactions]);

  const score = useMemo(() => {
    if (stats.income === 0) {
      return 0;
    }

    let result = 50;

    if (stats.savingsRate >= 30) {
      result += 40;
    } else if (
      stats.savingsRate >= 20
    ) {
      result += 30;
    } else if (
      stats.savingsRate >= 10
    ) {
      result += 20;
    } else if (
      stats.savingsRate >= 0
    ) {
      result += 10;
    } else {
      result -= 30;
    }

    if (transactions.length >= 5) {
      result += 5;
    }

    return Math.max(
      0,
      Math.min(100, result),
    );
  }, [
    stats,
    transactions.length,
  ]);

  const scoreLabel =
    score >= 80
      ? "Excellente situation"
      : score >= 65
        ? "Bonne situation"
        : score >= 50
          ? "Situation à améliorer"
          : "Attention à votre budget";

  const scoreDescription =
    score >= 80
      ? "Votre gestion financière présente de très bons indicateurs."
      : score >= 65
        ? "Votre situation est saine, avec encore quelques leviers d'amélioration."
        : score >= 50
          ? "Quelques ajustements pourraient améliorer votre capacité d'épargne."
          : "Vos dépenses nécessitent actuellement une attention particulière.";

  const priorityInsights = useMemo(() => {
    return [...insights].sort(
      (a, b) =>
        b.priority - a.priority,
    );
  }, [insights]);

  const positiveCount =
    insights.filter(
      (item) =>
        item.type === "success",
    ).length;

  const warningCount =
    insights.filter(
      (item) =>
        item.type === "warning",
    ).length;

  const infoCount =
    insights.filter(
      (item) =>
        item.type === "info",
    ).length;

  function formatCurrency(
    value: number,
  ) {
    return `${value.toLocaleString(
      "fr-FR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )} €`;
  }

  function getInsightStyle(
    type: Insight["type"],
  ) {
    if (type === "success") {
      return {
        icon: "✓",
        iconClass:
          "bg-[#e7f8f1] text-[#00a878]",
        borderClass:
          "border-[#d8eee7]",
        label: "POINT POSITIF",
      };
    }

    if (type === "warning") {
      return {
        icon: "!",
        iconClass:
          "bg-[#fff1f1] text-[#e86d6d]",
        borderClass:
          "border-[#f4dddd]",
        label: "ATTENTION",
      };
    }

    return {
      icon: "i",
      iconClass:
        "bg-[#edf6ff] text-[#4184b8]",
      borderClass:
        "border-[#dcebf5]",
      label: "ANALYSE",
    };
  }

  const finalError =
    accountError || error;

  return (
    <main className="min-h-screen bg-[#f5f8f7] text-[#071510]">
      <div className="mx-auto w-full max-w-[1250px] px-6 py-10 lg:px-10">

        {/* HEADER */}

        <header className="mb-10">

          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#00a878]">
            Intelligence financière
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  FinAI Insights
                </h1>

                <span className="rounded-full bg-[#e7f8f1] px-3 py-1 text-xs font-bold text-[#078862]">
                  BETA
                </span>

              </div>

              <p className="mt-3 max-w-2xl text-lg text-[#71807b]">
                {account
                  ? `Analyse intelligente de votre compte « ${account.name} ».`
                  : "Votre assistant financier analyse vos données et identifie les opportunités d'amélioration."}
              </p>

            </div>

            <button
              onClick={loadInsights}
              disabled={
                loading ||
                !accountId
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-5 text-sm font-semibold text-[#34423d] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >

              <span
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              Actualiser

            </button>

          </div>
        </header>

        {/* ERROR */}

        {finalError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {finalError}
          </div>
        )}

        {/* NO ACCOUNT */}

        {!accountLoading &&
        !accountId ? (
          <div className="flex min-h-[500px] items-center justify-center">

            <div className="max-w-md rounded-[28px] border border-[#e4ebe8] bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf7f4] text-2xl text-[#00a878]">
                ✦
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Aucun compte sélectionné
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#87938f]">
                Sélectionnez ou créez un compte
                bancaire pour afficher vos
                analyses FinAI.
              </p>

            </div>
          </div>
        ) : loading ||
          accountLoading ? (

          /* LOADING */

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="flex flex-col items-center">

              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d9e5e1] border-t-[#00a878]" />

              <p className="mt-4 text-sm text-[#71807b]">
                FinAI analyse votre situation...
              </p>

            </div>

          </div>
        ) : (

          <>
            {/* SCORE */}

            <section className="mb-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

              <div className="relative overflow-hidden rounded-[30px] bg-[#06251c] p-8 text-white shadow-xl shadow-[#06251c]/10">

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#00a878]/20 blur-3xl" />

                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#27d49e]/10 blur-3xl" />

                <div className="relative">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7edfc2]">
                      Score FinAI
                    </p>

                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16483a] text-sm">
                      ✦
                    </span>

                  </div>

                  <div className="mt-9 flex flex-col items-center gap-7 sm:flex-row">

                    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[8px] border-[#1c4c40]">

                      <div
                        className="absolute inset-[-8px] rounded-full border-[8px] border-transparent"
                        style={{
                          borderTopColor:
                            "#27d49e",
                          transform: `rotate(${
                            -45 +
                            score * 2.7
                          }deg)`,
                        }}
                      />

                      <div className="text-center">

                        <div className="text-4xl font-bold">
                          {score}
                        </div>

                        <div className="text-xs text-[#9cc7bb]">
                          / 100
                        </div>

                      </div>

                    </div>

                    <div>

                      <h2 className="text-2xl font-bold">
                        {scoreLabel}
                      </h2>

                      <p className="mt-3 max-w-sm text-sm leading-6 text-[#b7d1ca]">
                        {scoreDescription}
                      </p>

                    </div>

                  </div>

                  <div className="mt-8 h-2 overflow-hidden rounded-full bg-[#173e34]">

                    <div
                      className="h-full rounded-full bg-[#27d49e] transition-all duration-1000"
                      style={{
                        width: `${score}%`,
                      }}
                    />

                  </div>

                  <div className="mt-3 flex justify-between text-[10px] text-[#6e9b8d]">
                    <span>
                      À améliorer
                    </span>

                    <span>
                      Excellent
                    </span>
                  </div>

                </div>
              </div>

              {/* SUMMARY */}

              <div className="rounded-[30px] border border-[#e4ebe8] bg-white p-8 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#87938f]">
                      Vue d'ensemble
                    </p>

                    <h2 className="mt-3 text-2xl font-bold">
                      Votre situation
                    </h2>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f8f3] text-[#00a878]">
                    ◈
                  </div>

                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">

                  <QuickStat
                    label="Revenus"
                    value={formatCurrency(
                      stats.income,
                    )}
                    color="text-[#00a878]"
                  />

                  <QuickStat
                    label="Dépenses"
                    value={formatCurrency(
                      stats.expenses,
                    )}
                    color="text-[#ed6b6b]"
                  />

                  <QuickStat
                    label="Solde"
                    value={formatCurrency(
                      stats.balance,
                    )}
                    color={
                      stats.balance >= 0
                        ? "text-[#071510]"
                        : "text-[#ed6b6b]"
                    }
                  />

                  <QuickStat
                    label="Taux d'épargne"
                    value={`${stats.savingsRate.toFixed(
                      1,
                    )} %`}
                    color="text-[#087c5b]"
                  />

                </div>

                <div className="mt-5 flex flex-wrap gap-2">

                  <InsightBadge
                    label={`${positiveCount} positif${
                      positiveCount > 1
                        ? "s"
                        : ""
                    }`}
                    className="bg-[#e7f8f1] text-[#078862]"
                  />

                  <InsightBadge
                    label={`${warningCount} attention`}
                    className="bg-[#fff1f1] text-[#d65f5f]"
                  />

                  <InsightBadge
                    label={`${infoCount} analyse${
                      infoCount > 1
                        ? "s"
                        : ""
                    }`}
                    className="bg-[#edf6ff] text-[#4184b8]"
                  />

                </div>

              </div>

            </section>

            {/* INSIGHTS */}

            <section className="rounded-[30px] border border-[#e4ebe8] bg-white p-7 shadow-sm md:p-8">

              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a878]">
                    Recommandations
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Ce que FinAI a détecté
                  </h2>

                  <p className="mt-2 text-sm text-[#87938f]">
                    Des analyses basées sur vos
                    mouvements financiers.
                  </p>

                </div>

                <div className="rounded-xl bg-[#f3f8f6] px-4 py-2 text-sm font-semibold text-[#087c5b]">
                  {insights.length} analyse
                  {insights.length > 1
                    ? "s"
                    : ""}
                </div>

              </div>

              {priorityInsights.length ===
              0 ? (

                <div className="flex min-h-[250px] items-center justify-center text-center">

                  <div>

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#edf7f4] text-2xl text-[#00a878]">
                      ✦
                    </div>

                    <h3 className="mt-5 text-lg font-bold">
                      Pas encore d'analyse
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-[#87938f]">
                      Ajoutez davantage de
                      transactions pour obtenir
                      des recommandations plus
                      pertinentes.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="grid gap-4 lg:grid-cols-2">

                  {priorityInsights.map(
                    (insight, index) => {
                      const style =
                        getInsightStyle(
                          insight.type,
                        );

                      return (
                        <article
                          key={`${insight.title}-${index}`}
                          className={`group rounded-[24px] border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-md ${style.borderClass}`}
                        >

                          <div className="flex gap-4">

                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${style.iconClass}`}
                            >
                              {style.icon}
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-center justify-between gap-3">

                                <p className="text-[10px] font-bold tracking-[0.18em] text-[#9aa5a2]">
                                  {style.label}
                                </p>

                                {insight.priority >
                                  0 && (
                                  <span className="rounded-full bg-[#f5f8f7] px-2 py-1 text-[9px] font-bold text-[#87938f]">
                                    Priorité{" "}
                                    {
                                      insight.priority
                                    }
                                  </span>
                                )}

                              </div>

                              <h3 className="mt-2 text-lg font-bold leading-6">
                                {insight.title}
                              </h3>

                              <p className="mt-3 text-sm leading-6 text-[#71807b]">
                                {insight.message}
                              </p>

                            </div>

                          </div>

                        </article>
                      );
                    },
                  )}

                </div>
              )}

            </section>

            {/* FINAI CTA */}

            <section className="relative mt-6 overflow-hidden rounded-[30px] bg-[#06251c] p-7 text-white md:p-8">

              <div className="absolute right-[-70px] top-[-100px] h-64 w-64 rounded-full bg-[#00a878]/15 blur-3xl" />

              <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

                <div className="max-w-2xl">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#16483a] text-xl">
                      ✦
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7edfc2]">
                      Assistant FinAI
                    </p>

                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    Vous avez une question sur
                    vos finances ?
                  </h2>

                  <p className="mt-3 leading-7 text-[#a8c9bf]">
                    Demandez à FinAI d'analyser
                    votre solde, vos dépenses ou
                    votre capacité d'épargne.
                  </p>

                </div>

                <a
                  href="/chat"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#00a878] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#00966c]"
                >
                  Parler à FinAI
                  <span>→</span>
                </a>

              </div>

            </section>
          </>
        )}
      </div>
    </main>
  );
}

function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7faf9] p-5">

      <p className="text-xs font-medium text-[#87938f]">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${color}`}
      >
        {value}
      </p>

    </div>
  );
}

function InsightBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}