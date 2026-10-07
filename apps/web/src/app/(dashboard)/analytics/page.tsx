"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/context/account-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type MonthlySummary = {
  month: string;
  income: string;
  expenses: string;
  balance: string;
};

type CategorySummary = {
  category: string;
  amount: string;
  transaction_count: number;
};

type Transaction = {
  id: number;
  account_id: number;
  amount: string;
  description: string;
  category: string;
  transaction_type: "income" | "expense";
};

const categoryColors = [
  "#00a878",
  "#36c49b",
  "#79d9bd",
  "#a8e8d6",
  "#d1f2e7",
];

export default function AnalyticsPage() {
  const {
    userId,
    account,
    accountId,
    loading: accountLoading,
    error: accountError,
  } = useAccount();

  const [monthly, setMonthly] =
    useState<MonthlySummary[]>([]);

  const [categories, setCategories] =
    useState<CategorySummary[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadAnalytics() {
    if (!accountId) {
      setMonthly([]);
      setCategories([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        monthlyResponse,
        categoriesResponse,
        transactionsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/users/${userId}/accounts/${accountId}/monthly`,
        ),

        fetch(
          `${API_URL}/users/${userId}/accounts/${accountId}/categories`,
        ),

        fetch(
          `${API_URL}/users/${userId}/accounts/${accountId}/transactions`,
        ),
      ]);

      if (
        !monthlyResponse.ok ||
        !categoriesResponse.ok ||
        !transactionsResponse.ok
      ) {
        throw new Error(
          "Impossible de récupérer les données.",
        );
      }

      const [
        monthlyData,
        categoriesData,
        transactionsData,
      ] = await Promise.all([
        monthlyResponse.json(),
        categoriesResponse.json(),
        transactionsResponse.json(),
      ]);

      setMonthly(monthlyData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    loadAnalytics();
  }, [accountLoading, userId, accountId]);

  const totals = useMemo(() => {
    const income = transactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
          "income",
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Math.abs(Number(transaction.amount)),
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
          Math.abs(Number(transaction.amount)),
        0,
      );

    const balance = income - expenses;

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

  const sortedCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) =>
        Number(b.amount) -
        Number(a.amount),
    );
  }, [categories]);

  const biggestCategory =
    sortedCategories[0] ?? null;

  const maxMonthlyValue = useMemo(() => {
    if (!monthly.length) {
      return 1;
    }

    return Math.max(
      ...monthly.flatMap((item) => [
        Number(item.income),
        Number(item.expenses),
      ]),
      1,
    );
  }, [monthly]);

  const maxCategoryValue = useMemo(() => {
    if (!categories.length) {
      return 1;
    }

    return Math.max(
      ...categories.map((item) =>
        Number(item.amount),
      ),
      1,
    );
  }, [categories]);

  function formatCurrency(value: number) {
    return `${value.toLocaleString(
      "fr-FR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )} €`;
  }

  function formatMonth(month: string) {
    if (!month) {
      return "";
    }

    const [year, monthNumber] =
      month.split("-");

    if (!year || !monthNumber) {
      return month;
    }

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1,
    );

    return date.toLocaleDateString(
      "fr-FR",
      {
        month: "short",
      },
    );
  }

  const insightText =
    totals.income === 0
      ? "Ajoutez vos premiers revenus pour commencer à analyser votre capacité d’épargne."
      : totals.savingsRate >= 30
        ? "Excellent rythme d’épargne. Vous conservez une part importante de vos revenus."
        : totals.savingsRate >= 15
          ? "Votre épargne est positive. Vous disposez d’une bonne base pour améliorer encore votre gestion."
          : totals.savingsRate >= 0
            ? "Votre solde reste positif, mais votre marge d’épargne pourrait être améliorée."
            : "Vos dépenses dépassent actuellement vos revenus. Identifiez les catégories à optimiser.";

  const finalError =
    accountError || error;

  return (
    <main className="min-h-screen bg-[#f5f8f7] text-[#071510]">
      <div className="mx-auto w-full max-w-[1250px] px-6 py-10 lg:px-10">

        {/* HEADER */}

        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#00a878]">
            Votre analyse financière
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Analytics
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-[#71807b]">
                {account
                  ? `Analyse des données de votre compte « ${account.name} ».`
                  : "Visualisez vos habitudes financières et comprenez où va votre argent."}
              </p>
            </div>

            <button
              onClick={loadAnalytics}
              disabled={!accountId || loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-5 text-sm font-semibold text-[#34423d] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-base">
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

        {!accountLoading && !accountId ? (
          <div className="flex min-h-[520px] items-center justify-center">
            <div className="max-w-md rounded-[28px] border border-[#e4ebe8] bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf7f4] text-2xl text-[#00a878]">
                ◌
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Aucun compte sélectionné
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#87938f]">
                Sélectionnez ou créez un compte
                bancaire pour afficher vos
                analyses financières.
              </p>

            </div>
          </div>
        ) : loading || accountLoading ? (

          /* LOADING */

          <div className="flex min-h-[520px] items-center justify-center">

            <div className="flex flex-col items-center">

              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dce8e4] border-t-[#00a878]" />

              <p className="mt-4 text-sm text-[#71807b]">
                Analyse de vos données...
              </p>

            </div>

          </div>
        ) : (

          <>
            {/* KPI */}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <AnalyticsCard
                label="Revenus"
                value={formatCurrency(
                  totals.income,
                )}
                description="Revenus cumulés"
                icon="↗"
                iconClass="bg-[#e8f8f3] text-[#00a878]"
                valueClass="text-[#00a878]"
              />

              <AnalyticsCard
                label="Dépenses"
                value={formatCurrency(
                  totals.expenses,
                )}
                description="Dépenses cumulées"
                icon="↘"
                iconClass="bg-[#fff0f0] text-[#ed6b6b]"
                valueClass="text-[#ed6b6b]"
              />

              <AnalyticsCard
                label="Solde"
                value={formatCurrency(
                  totals.balance,
                )}
                description="Revenus moins dépenses"
                icon="€"
                iconClass="bg-[#edf7f4] text-[#087c5b]"
                valueClass={
                  totals.balance >= 0
                    ? "text-[#071510]"
                    : "text-[#ed6b6b]"
                }
              />

              <AnalyticsCard
                label="Taux d'épargne"
                value={`${totals.savingsRate.toFixed(
                  1,
                )} %`}
                description="Part de vos revenus conservée"
                icon="✦"
                iconClass="bg-[#e8f8f3] text-[#00a878]"
                valueClass="text-[#087c5b]"
              />

            </section>

            {/* MAIN GRID */}

            <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">

              {/* EVOLUTION */}

              <div className="rounded-[28px] border border-[#e4ebe8] bg-white shadow-sm">

                <div className="flex flex-col justify-between gap-5 border-b border-[#edf1ef] p-7 sm:flex-row sm:items-center">

                  <div>
                    <h2 className="text-xl font-bold">
                      Évolution financière
                    </h2>

                    <p className="mt-1 text-sm text-[#87938f]">
                      Revenus et dépenses par mois
                    </p>
                  </div>

                  <div className="flex items-center gap-5 text-xs font-semibold text-[#5d6965]">

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00a878]" />
                      Revenus
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ed6b6b]" />
                      Dépenses
                    </div>

                  </div>

                </div>

                {monthly.length === 0 ? (

                  <EmptyAnalytics text="Pas encore assez de données mensuelles." />

                ) : (

                  <div className="p-7">

                    <div className="mb-8 flex items-end justify-between">

                      <div>
                        <p className="text-sm text-[#87938f]">
                          Solde actuel
                        </p>

                        <p
                          className={`mt-1 text-3xl font-bold ${
                            totals.balance >= 0
                              ? "text-[#071510]"
                              : "text-[#ed6b6b]"
                          }`}
                        >
                          {formatCurrency(
                            totals.balance,
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          totals.savingsRate >= 0
                            ? "bg-[#e8f8f3] text-[#078862]"
                            : "bg-[#fff0f0] text-[#ed6b6b]"
                        }`}
                      >
                        {totals.savingsRate >= 0
                          ? "+"
                          : ""}
                        {totals.savingsRate.toFixed(
                          1,
                        )}{" "}
                        %
                      </span>

                    </div>

                    {/* CHART */}

                    <div className="relative h-[280px] w-full">

                      <div className="absolute inset-0 flex flex-col justify-between">

                        {[0, 1, 2, 3, 4].map(
                          (line) => (
                            <div
                              key={line}
                              className="border-t border-dashed border-[#edf1ef]"
                            />
                          ),
                        )}

                      </div>

                      <svg
                        viewBox="0 0 800 250"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        {monthly.length > 1 && (
                          <>
                            <ChartLine
                              values={monthly.map(
                                (item) =>
                                  Number(
                                    item.income,
                                  ),
                              )}
                              max={
                                maxMonthlyValue
                              }
                              color="#00a878"
                            />

                            <ChartLine
                              values={monthly.map(
                                (item) =>
                                  Number(
                                    item.expenses,
                                  ),
                              )}
                              max={
                                maxMonthlyValue
                              }
                              color="#ed6b6b"
                            />
                          </>
                        )}
                      </svg>

                      <div className="absolute bottom-[-28px] left-0 right-0 flex justify-between">

                        {monthly.map(
                          (item) => (
                            <span
                              key={item.month}
                              className="text-xs font-medium text-[#9aa5a2]"
                            >
                              {formatMonth(
                                item.month,
                              )}
                            </span>
                          ),
                        )}

                      </div>

                    </div>

                    {/* MONTHLY VALUES */}

                    <div className="mt-14 space-y-4">

                      {monthly.map(
                        (item) => (
                          <div
                            key={item.month}
                            className="flex items-center justify-between rounded-xl bg-[#f8faf9] px-4 py-3"
                          >

                            <span className="text-sm font-semibold capitalize text-[#35423e]">
                              {formatMonth(
                                item.month,
                              )}
                            </span>

                            <div className="flex gap-5 text-xs font-semibold">

                              <span className="text-[#00a878]">
                                +
                                {formatCurrency(
                                  Number(
                                    item.income,
                                  ),
                                )}
                              </span>

                              <span className="text-[#ed6b6b]">
                                -
                                {formatCurrency(
                                  Number(
                                    item.expenses,
                                  ),
                                )}
                              </span>

                            </div>

                          </div>
                        ),
                      )}

                    </div>

                  </div>
                )}

              </div>

              {/* CATEGORIES */}

              <div className="rounded-[28px] border border-[#e4ebe8] bg-white shadow-sm">

                <div className="border-b border-[#edf1ef] p-7">

                  <h2 className="text-xl font-bold">
                    Dépenses
                  </h2>

                  <p className="mt-1 text-sm text-[#87938f]">
                    Répartition par catégorie
                  </p>

                </div>

                {sortedCategories.length === 0 ? (

                  <EmptyAnalytics text="Aucune dépense catégorisée." />

                ) : (

                  <div className="p-7">

                    <CategoryDonut
                      categories={
                        sortedCategories
                      }
                      total={
                        totals.expenses
                      }
                    />

                    <div className="mt-8 space-y-5">

                      {sortedCategories.map(
                        (item, index) => {
                          const amount =
                            Number(
                              item.amount,
                            );

                          const percentage =
                            totals.expenses >
                            0
                              ? (amount /
                                  totals.expenses) *
                                100
                              : 0;

                          const width =
                            (amount /
                              maxCategoryValue) *
                            100;

                          return (
                            <div
                              key={
                                item.category
                              }
                            >

                              <div className="mb-2 flex items-center justify-between gap-3">

                                <div className="flex min-w-0 items-center gap-3">

                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                      background:
                                        categoryColors[
                                          index %
                                            categoryColors.length
                                        ],
                                    }}
                                  />

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-semibold">
                                      {
                                        item.category
                                      }
                                    </p>

                                    <p className="text-xs text-[#9aa5a2]">
                                      {
                                        item.transaction_count
                                      }{" "}
                                      mouvement
                                      {item.transaction_count >
                                      1
                                        ? "s"
                                        : ""}
                                    </p>

                                  </div>

                                </div>

                                <div className="shrink-0 text-right">

                                  <p className="text-sm font-bold">
                                    {formatCurrency(
                                      amount,
                                    )}
                                  </p>

                                  <p className="text-xs text-[#9aa5a2]">
                                    {percentage.toFixed(
                                      1,
                                    )}{" "}
                                    %
                                  </p>

                                </div>

                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-[#edf4f1]">

                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${width}%`,
                                    background:
                                      categoryColors[
                                        index %
                                          categoryColors.length
                                      ],
                                  }}
                                />

                              </div>

                            </div>
                          );
                        },
                      )}

                    </div>

                  </div>
                )}

              </div>

            </section>

            {/* INSIGHTS */}

            <section className="mt-6 grid gap-6 md:grid-cols-2">

              {/* BIGGEST CATEGORY */}

              <div className="relative overflow-hidden rounded-[28px] border border-[#d8eee7] bg-[#ecfaf5] p-7">

                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#ccefe4] opacity-60" />

                <div className="relative">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#078862]">
                      Catégorie principale
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#00a878] shadow-sm">
                      ↗
                    </span>

                  </div>

                  {biggestCategory ? (
                    <>
                      <h2 className="mt-6 text-2xl font-bold text-[#09231d]">
                        {
                          biggestCategory.category
                        }
                      </h2>

                      <p className="mt-2 text-[#54716a]">
                        {formatCurrency(
                          Number(
                            biggestCategory.amount,
                          ),
                        )}{" "}
                        dépensés dans cette catégorie.
                      </p>

                      <div className="mt-6 flex items-center justify-between">

                        <span className="text-sm text-[#54716a]">
                          Part des dépenses
                        </span>

                        <span className="font-bold text-[#078862]">
                          {totals.expenses >
                          0
                            ? (
                                (Number(
                                  biggestCategory.amount,
                                ) /
                                  totals.expenses) *
                                100
                              ).toFixed(
                                1,
                              )
                            : "0.0"}
                          %
                        </span>

                      </div>
                    </>
                  ) : (
                    <p className="mt-6 text-[#54716a]">
                      Pas encore suffisamment
                      de données.
                    </p>
                  )}

                </div>
              </div>

              {/* FINAI */}

              <div className="rounded-[28px] border border-[#e4ebe8] bg-white p-7 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00a878]">
                      FinAI Intelligence
                    </p>

                    <h2 className="mt-3 text-2xl font-bold">
                      Votre situation
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f8f3] text-[#00a878]">
                    ✦
                  </div>

                </div>

                <p className="mt-5 leading-7 text-[#71807b]">
                  {insightText}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-[#edf1ef] pt-5">

                  <span className="text-sm text-[#87938f]">
                    Transactions analysées
                  </span>

                  <span className="font-bold">
                    {transactions.length}
                  </span>

                </div>

              </div>

            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   KPI CARD
   ========================================================= */

function AnalyticsCard({
  label,
  value,
  description,
  icon,
  iconClass,
  valueClass,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#e4ebe8] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <p className="text-sm font-medium text-[#71807b]">
          {label}
        </p>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${iconClass}`}
        >
          {icon}
        </span>

      </div>

      <p
        className={`mt-6 text-3xl font-bold tracking-tight ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-3 text-sm text-[#87938f]">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   LINE CHART
   ========================================================= */

function ChartLine({
  values,
  max,
  color,
}: {
  values: number[];
  max: number;
  color: string;
}) {
  if (values.length === 0) {
    return null;
  }

  const width = 800;
  const height = 250;
  const paddingX = 20;
  const paddingY = 20;

  const usableWidth =
    width - paddingX * 2;

  const usableHeight =
    height - paddingY * 2;

  const points = values.map(
    (value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : paddingX +
            (index /
              (values.length - 1)) *
              usableWidth;

      const y =
        height -
        paddingY -
        (value / max) *
          usableHeight;

      return `${x},${y}`;
    },
  );

  return (
    <>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {values.map(
        (value, index) => {
          const x =
            values.length === 1
              ? width / 2
              : paddingX +
                (index /
                  (values.length - 1)) *
                  usableWidth;

          const y =
            height -
            paddingY -
            (value / max) *
              usableHeight;

          return (
            <circle
              key={`${color}-${index}`}
              cx={x}
              cy={y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          );
        },
      )}
    </>
  );
}

/* =========================================================
   DONUT
   ========================================================= */

function CategoryDonut({
  categories,
  total,
}: {
  categories: CategorySummary[];
  total: number;
}) {
  const radius = 70;

  const circumference =
    2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="flex justify-center">

      <div className="relative h-52 w-52">

        <svg
          viewBox="0 0 180 180"
          className="h-full w-full -rotate-90"
        >

          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#edf4f1"
            strokeWidth="20"
          />

          {categories
            .slice(0, 5)
            .map(
              (item, index) => {
                const amount =
                  Number(item.amount);

                const percentage =
                  total > 0
                    ? amount / total
                    : 0;

                const dash =
                  percentage *
                  circumference;

                const offset =
                  -accumulated *
                  circumference;

                accumulated +=
                  percentage;

                return (
                  <circle
                    key={
                      item.category
                    }
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={
                      categoryColors[
                        index %
                          categoryColors.length
                      ]
                    }
                    strokeWidth="20"
                    strokeDasharray={`${dash} ${
                      circumference -
                      dash
                    }`}
                    strokeDashoffset={
                      offset
                    }
                    strokeLinecap="round"
                  />
                );
              },
            )}

        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

          <span className="text-xs font-medium text-[#87938f]">
            Total
          </span>

          <span className="mt-1 text-2xl font-bold">
            {total.toLocaleString(
              "fr-FR",
              {
                maximumFractionDigits: 0,
              },
            )}{" "}
            €
          </span>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyAnalytics({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6 text-center">

      <div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f4] text-xl text-[#00a878]">
          ◌
        </div>

        <p className="mt-4 text-sm text-[#87938f]">
          {text}
        </p>

      </div>

    </div>
  );
}