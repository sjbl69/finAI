"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAccount } from "@/context/account-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type TransactionType = "income" | "expense";

type Transaction = {
  id: number;
  account_id: number;
  amount: string;
  description: string;
  category: string;
  transaction_type: TransactionType;
};

const categories = [
  "Alimentation",
  "Logement",
  "Transport",
  "Shopping",
  "Loisirs",
  "Santé",
  "Abonnements",
  "Salaire",
  "Investissement",
  "Autre",
];

export default function TransactionsPage() {
  const {
    userId,
    account,
    accountId,
    loading: accountLoading,
    error: accountError,
  } = useAccount();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [type, setType] =
    useState<TransactionType>("expense");

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("Alimentation");

  async function loadTransactions() {
    if (!accountId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/users/${userId}/accounts/${accountId}/transactions`,
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les transactions.",
        );
      }

      const data: Transaction[] =
        await response.json();

      setTransactions(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les transactions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [userId, accountId]);

  const statistics = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      const value = Math.abs(
        Number(transaction.amount),
      );

      if (
        transaction.transaction_type ===
        "income"
      ) {
        income += value;
      } else {
        expenses += value;
      }
    }

    return {
      income,
      expenses,
      balance: income - expenses,
      count: transactions.length,
    };
  }, [transactions]);

  function resetForm() {
    setType("expense");
    setAmount("");
    setDescription("");
    setCategory("Alimentation");
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setIsModalOpen(false);
    resetForm();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accountId) {
      setError(
        "Aucun compte bancaire sélectionné.",
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError(
        "Veuillez saisir un montant valide.",
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Veuillez saisir une description.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const numericAmount = Math.abs(
        Number(amount),
      );

      const transactionAmount =
        type === "expense"
          ? -numericAmount
          : numericAmount;

      const response = await fetch(
        `${API_URL}/users/${userId}/accounts/${accountId}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amount: transactionAmount,
            description:
              description.trim(),
            category,
            transaction_type: type,
          }),
        },
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.detail ??
            "Impossible de créer la transaction.",
        );
      }

      await loadTransactions();

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatAmount(amount: string) {
    const value = Number(amount);

    return new Intl.NumberFormat(
      "fr-FR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(Math.abs(value));
  }

  const finalError =
    accountError || error;

  const isLoading =
    accountLoading || loading;

  return (
    <main className="min-h-screen bg-[#f5f8f7] text-[#071510]">
      <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">

        {/* HEADER */}

        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#00a878]">
              Votre activité financière
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Transactions ↔
            </h1>

            <p className="mt-3 text-lg text-[#71807b]">
              {account
                ? `Les mouvements de votre compte « ${account.name} ».`
                : "Retrouvez et gérez l’ensemble de vos mouvements financiers."}
            </p>
          </div>

          <button
            onClick={() =>
              setIsModalOpen(true)
            }
            disabled={!accountId}
            className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#06251c] px-7 font-semibold text-white shadow-lg shadow-[#06251c]/10 transition hover:-translate-y-0.5 hover:bg-[#0b3428] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-xl">
              +
            </span>

            Nouvelle transaction
          </button>

        </header>

        {/* STATISTIQUES */}

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Solde"
            value={statistics.balance}
            description="Solde calculé sur vos transactions"
            variant="balance"
          />

          <StatCard
            label="Revenus"
            value={statistics.income}
            description="Revenus cumulés"
            variant="income"
          />

          <StatCard
            label="Dépenses"
            value={statistics.expenses}
            description="Dépenses cumulées"
            variant="expense"
          />

          <StatCard
            label="Transactions"
            value={statistics.count}
            description="Mouvements enregistrés"
            variant="neutral"
            isCount
          />

        </section>

        {/* ERREUR */}

        {finalError && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">

            <span>
              {finalError}
            </span>

            <button
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>

          </div>
        )}

        {/* LISTE */}

        <section className="overflow-hidden rounded-[28px] border border-[#e4ebe8] bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-4 border-b border-[#edf1ef] px-6 py-6 md:flex-row md:items-center md:px-8">

            <div>
              <h2 className="text-xl font-bold">
                Toutes les transactions
              </h2>

              <p className="mt-1 text-sm text-[#87938f]">
                L’historique de vos mouvements financiers
              </p>
            </div>

            <div className="rounded-xl bg-[#f3f8f6] px-4 py-2 text-sm font-semibold text-[#087c5b]">
              {statistics.count} mouvement
              {statistics.count > 1
                ? "s"
                : ""}
            </div>

          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex items-center gap-3 text-[#71807b]">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d9e5e1] border-t-[#00a878]" />

                Chargement...

              </div>

            </div>
          ) : !accountId ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 text-center text-sm text-[#87938f]">
              Aucun compte bancaire sélectionné.
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              onCreate={() =>
                setIsModalOpen(true)
              }
            />
          ) : (
            <div className="divide-y divide-[#edf1ef]">

              {transactions.map(
                (transaction) => {
                  const isIncome =
                    transaction.transaction_type ===
                    "income";

                  return (
                    <div
                      key={
                        transaction.id
                      }
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-[#fafcfb] md:flex-row md:items-center md:justify-between md:px-8"
                    >

                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${
                            isIncome
                              ? "bg-[#e8f8f2] text-[#00a878]"
                              : "bg-[#fff0f0] text-[#ed6b6b]"
                          }`}
                        >
                          {isIncome
                            ? "↗"
                            : "↘"}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {
                              transaction.description
                            }
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#87938f]">

                            <span>
                              {
                                transaction.category
                              }
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {isIncome
                                ? "Revenu"
                                : "Dépense"}
                            </span>

                          </div>
                        </div>

                      </div>

                      <div
                        className={`text-lg font-bold ${
                          isIncome
                            ? "text-[#00a878]"
                            : "text-[#ed6b6b]"
                        }`}
                      >
                        {isIncome
                          ? "+"
                          : "-"}
                        {formatAmount(
                          transaction.amount,
                        )}{" "}
                        €
                      </div>

                    </div>
                  );
                },
              )}

            </div>
          )}

        </section>
      </div>

      {/* MODAL */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#06130f]/50 px-4 py-6 backdrop-blur-sm md:items-center"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          {/* CONTENEUR MODAL AVEC SCROLL */}

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf1ef] bg-white px-7 py-6">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a878]">
                  Nouveau mouvement
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Ajouter une transaction
                </h2>
              </div>

              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f6f5] text-xl text-[#71807b] transition hover:bg-[#e8eeeb]"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 px-7 py-7"
            >

              {/* TYPE */}

              <div>
                <label className="mb-3 block text-sm font-semibold">
                  Type de transaction
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setType("expense")
                    }
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      type === "expense"
                        ? "border-[#ed6b6b] bg-[#fff4f4] text-[#d95757]"
                        : "border-[#e1e9e5] hover:bg-[#fafcfb]"
                    }`}
                  >
                    <div className="text-xl">
                      ↘
                    </div>

                    <div className="mt-2 font-semibold">
                      Dépense
                    </div>

                    <div className="mt-1 text-xs opacity-70">
                      Argent dépensé
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setType("income")
                    }
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      type === "income"
                        ? "border-[#00a878] bg-[#effaf6] text-[#008d69]"
                        : "border-[#e1e9e5] hover:bg-[#fafcfb]"
                    }`}
                  >
                    <div className="text-xl">
                      ↗
                    </div>

                    <div className="mt-2 font-semibold">
                      Revenu
                    </div>

                    <div className="mt-1 text-xs opacity-70">
                      Argent reçu
                    </div>
                  </button>

                </div>
              </div>

              {/* MONTANT */}

              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-semibold"
                >
                  Montant
                </label>

                <div className="relative">

                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value,
                      )
                    }
                    className="h-14 w-full rounded-2xl border border-[#dfe8e4] bg-[#fafcfb] px-5 pr-12 text-xl font-semibold outline-none transition placeholder:text-[#b1bbb7] focus:border-[#00a878] focus:bg-white focus:ring-4 focus:ring-[#00a878]/10"
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-semibold text-[#87938f]">
                    €
                  </span>

                </div>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Description
                </label>

                <input
                  id="description"
                  type="text"
                  placeholder={
                    type === "income"
                      ? "Ex. Salaire"
                      : "Ex. Courses"
                  }
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  className="h-14 w-full rounded-2xl border border-[#dfe8e4] bg-[#fafcfb] px-5 outline-none transition placeholder:text-[#b1bbb7] focus:border-[#00a878] focus:bg-white focus:ring-4 focus:ring-[#00a878]/10"
                />
              </div>

              {/* CATEGORIE */}

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Catégorie
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                  className="h-14 w-full rounded-2xl border border-[#dfe8e4] bg-[#fafcfb] px-5 outline-none transition focus:border-[#00a878] focus:bg-white focus:ring-4 focus:ring-[#00a878]/10"
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* ERREUR FORMULAIRE */}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="h-14 flex-1 rounded-2xl border border-[#dfe8e4] font-semibold text-[#52605b] transition hover:bg-[#f6f9f8]"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !accountId
                  }
                  className="h-14 flex-1 rounded-2xl bg-[#06251c] font-semibold text-white transition hover:bg-[#0b3428] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Ajout..."
                    : "Ajouter la transaction"}
                </button>

              </div>

              {/* ESPACE EN BAS POUR MOBILE */}

              <div className="h-2" />

            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
  variant,
  isCount = false,
}: {
  label: string;
  value: number;
  description: string;
  variant:
    | "balance"
    | "income"
    | "expense"
    | "neutral";
  isCount?: boolean;
}) {
  const colors = {
    balance: "border-[#bde9dc]",
    income: "border-[#e4ebe8]",
    expense: "border-[#e4ebe8]",
    neutral: "border-[#e4ebe8]",
  };

  const valueColors = {
    balance:
      value >= 0
        ? "text-[#071510]"
        : "text-[#ed6b6b]",
    income: "text-[#00a878]",
    expense: "text-[#ed6b6b]",
    neutral: "text-[#071510]",
  };

  const formatted = isCount
    ? value.toString()
    : `${value < 0 ? "-" : ""}${new Intl.NumberFormat(
        "fr-FR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      ).format(Math.abs(value))} €`;

  return (
    <div
      className={`rounded-[24px] border bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[variant]}`}
    >
      <p className="text-sm font-medium text-[#71807b]">
        {label}
      </p>

      <p
        className={`mt-5 text-3xl font-bold tracking-tight ${valueColors[variant]}`}
      >
        {variant === "income" &&
          "+"}

        {formatted}
      </p>

      <p className="mt-3 text-sm text-[#87938f]">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eaf7f3] text-2xl text-[#00a878]">
        ↔
      </div>

      <h3 className="mt-5 text-xl font-bold">
        Aucune transaction
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[#87938f]">
        Commencez à enregistrer vos revenus
        et vos dépenses pour suivre
        précisément votre situation financière.
      </p>

      <button
        onClick={onCreate}
        className="mt-6 rounded-2xl bg-[#06251c] px-6 py-3 font-semibold text-white transition hover:bg-[#0b3428]"
      >
        + Ajouter une transaction
      </button>

    </div>
  );
}