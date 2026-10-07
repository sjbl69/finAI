"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useAccount } from "@/context/account-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Summary = {
  income: string;
  expenses: string;
  balance: string;
  transaction_count: number;
};

type Category = {
  category: string;
  amount: string;
  transaction_count: number;
};

type MonthlySummary = {
  month: string;
  income: string;
  expenses: string;
  balance: string;
};

type Transaction = {
  id: number;
  amount: string;
  description: string;
  category: string;
  transaction_type: "income" | "expense";
};

function formatEuro(value: string | number) {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(number)) {
    return "0,00 €";
  }

  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number) + " €"
  );
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "logement":
      return "⌂";

    case "alimentation":
      return "◈";

    case "abonnements":
      return "▣";

    case "transport":
      return "↔";

    case "loisirs":
      return "◇";

    default:
      return "◇";
  }
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

export default function DashboardPage() {
  const { user, token } = useAuth();

  const {
    userId,
    accountId,
    accounts,
    loading: accountLoading,
  } = useAccount();

  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [monthlyData, setMonthlyData] =
    useState<MonthlySummary[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showAddChoice, setShowAddChoice] =
    useState(false);

  const [showBankModal, setShowBankModal] =
    useState(false);

  const [showManualModal, setShowManualModal] =
    useState(false);

  const [manualName, setManualName] =
    useState("");

  const [manualType, setManualType] =
    useState("");

  const [manualBalance, setManualBalance] =
    useState("");

  const [manualLoading, setManualLoading] =
    useState(false);

  const [manualError, setManualError] =
    useState<string | null>(null);

  /*
   * =====================================================
   * NOM D'AFFICHAGE
   * =====================================================
   */

  const [displayName, setDisplayName] =
    useState("Utilisateur");

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(
        "finai-user-name",
      );

    if (savedName?.trim()) {
      setDisplayName(savedName.trim());
    }
  }, []);

  /*
   * =====================================================
   * CHARGEMENT DES DONNÉES DU DASHBOARD
   * =====================================================
   */

  useEffect(() => {
    async function loadDashboard() {
      /*
       * L'AccountProvider est encore
       * en train de charger les comptes.
       */
      if (accountLoading) {
        return;
      }

      /*
       * Pas de session utilisateur.
       */
      if (!userId || !token) {
        setSummary(null);
        setCategories([]);
        setMonthlyData([]);
        setTransactions([]);
        setError(null);
        setLoading(false);
        return;
      }

      /*
       * Utilisateur connecté mais aucun
       * compte bancaire sélectionné.
       *
       * IMPORTANT :
       * on passe loading à false ici.
       * C'était la cause du chargement infini.
       */
      if (!accountId) {
        setSummary(null);
        setCategories([]);
        setMonthlyData([]);
        setTransactions([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [
          summaryResponse,
          categoriesResponse,
          monthlyResponse,
          transactionsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/users/${userId}/accounts/${accountId}/summary`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),

          fetch(
            `${API_URL}/users/${userId}/accounts/${accountId}/categories`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),

          fetch(
            `${API_URL}/users/${userId}/accounts/${accountId}/monthly`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),

          fetch(
            `${API_URL}/users/${userId}/accounts/${accountId}/transactions`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),
        ]);

        if (
          !summaryResponse.ok ||
          !categoriesResponse.ok ||
          !monthlyResponse.ok ||
          !transactionsResponse.ok
        ) {
          throw new Error(
            "Impossible de récupérer les données financières.",
          );
        }

        const [
          summaryData,
          categoriesData,
          monthlyDataResponse,
          transactionsData,
        ] = await Promise.all([
          summaryResponse.json(),
          categoriesResponse.json(),
          monthlyResponse.json(),
          transactionsResponse.json(),
        ]);

        setSummary(summaryData);
        setCategories(categoriesData);
        setMonthlyData(monthlyDataResponse);

        setTransactions(
          [...transactionsData].reverse(),
        );
      } catch (err) {
        console.error(
          "Erreur Dashboard FinAI :",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Une erreur est survenue.",
        );

        setSummary(null);
        setCategories([]);
        setMonthlyData([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [
    accountLoading,
    userId,
    accountId,
    token,
  ]);

  /*
   * =====================================================
   * CALCULS
   * =====================================================
   */

  const savings = useMemo(() => {
    if (!summary) {
      return 0;
    }

    return (
      Number(summary.income) -
      Number(summary.expenses)
    );
  }, [summary]);

  const savingsRate = useMemo(() => {
    if (
      !summary ||
      Number(summary.income) <= 0
    ) {
      return 0;
    }

    return Math.round(
      (savings /
        Number(summary.income)) *
        100,
    );
  }, [summary, savings]);

  const maxMonthlyValue = useMemo(() => {
    if (!monthlyData.length) {
      return 1;
    }

    return Math.max(
      ...monthlyData.flatMap(
        (item) => [
          Number(item.income),
          Number(item.expenses),
        ],
      ),
      1,
    );
  }, [monthlyData]);

  const sortedCategories =
    useMemo(() => {
      return [...categories]
        .sort(
          (a, b) =>
            Number(b.amount) -
            Number(a.amount),
        )
        .slice(0, 5);
    }, [categories]);

  const totalCategoryExpenses =
    useMemo(() => {
      return categories.reduce(
        (sum, category) =>
          sum + Number(category.amount),
        0,
      );
    }, [categories]);

  const recentTransactions =
    transactions.slice(0, 5);

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <>
      {/* =================================================
          TOPBAR
          ================================================= */}

      <header className="topbar">
        <div className="mobile-brand">
          <div className="brand-mark small">
            <span>F</span>
          </div>

          <span>
            FinAI
          </span>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications"
          >
            ✦

            <span className="notification-dot" />
          </button>

          <button
            type="button"
            className="date-button"
          >
            <span>
              ◷
            </span>

            <span>
              Août 2026
            </span>

            <span className="chevron">
              ˅
            </span>
          </button>
        </div>
      </header>

      {/* =================================================
          DASHBOARD
          ================================================= */}

      <div className="dashboard">

        {/* =================================================
            CHARGEMENT
            ================================================= */}

        {loading || accountLoading ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              color: "#7a8783",
            }}
          >
            Chargement de votre espace
            financier...
          </div>
        ) : error ? (
          /* =================================================
             ERREUR
             ================================================= */

          <div
            style={{
              marginBottom: "24px",
              padding: "16px 20px",
              borderRadius: "14px",
              background: "#fff1f2",
              color: "#be123c",
              border:
                "1px solid #fecdd3",
            }}
          >
            {error}
          </div>
        ) : accounts.length === 0 ||
          !accountId ? (
          /* =================================================
             AUCUN COMPTE
             ================================================= */

          <>
            <section className="welcome">
              <div>
                <div className="eyebrow">
                  VOTRE ESPACE FINANCIER
                </div>

                <h1 style={{ margin: 0 }}>
                  Bonjour {displayName}{" "}
                  <span>👋</span>
                </h1>

                <p>
                  Voici un aperçu de votre
                  situation financière.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowAddChoice(true)
                }
              >
                <span>
                  ＋
                </span>

                Ajouter un compte
              </button>
            </section>

            <div
              className="panel"
              style={{
                padding:
                  "60px 30px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "38px",
                  marginBottom:
                    "15px",
                }}
              >
                💳
              </div>

              <h2
                style={{
                  marginBottom:
                    "8px",
                  fontSize:
                    "18px",
                  fontWeight:
                    700,
                }}
              >
                Aucun compte bancaire
              </h2>

              <p
                style={{
                  color:
                    "#8a9692",
                  fontSize:
                    "12px",
                  marginBottom:
                    "22px",
                }}
              >
                Ajoutez votre premier
                compte bancaire pour
                commencer à suivre vos
                finances.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowAddChoice(true)
                }
                style={{
                  display:
                    "inline-flex",
                }}
              >
                <span>
                  ＋
                </span>

                Ajouter un compte
              </button>
            </div>
          </>
        ) : (
          /* =================================================
             DASHBOARD COMPLET
             ================================================= */

          <>
            {/* =============================================
                WELCOME
                ============================================= */}

            <section className="welcome">
              <div>
                <div className="eyebrow">
                  VOTRE ESPACE FINANCIER
                </div>

                <h1 style={{ margin: 0 }}>
                  Bonjour {displayName}{" "}
                  <span>👋</span>
                </h1>

                <p>
                  Voici un aperçu de votre
                  situation financière.
                </p>
              </div>

              <Link
                href="/transactions"
                className="primary-button"
              >
                <span>
                  ＋
                </span>

                Nouvelle transaction
              </Link>
            </section>

            {/* =============================================
                STATISTIQUES
                ============================================= */}

            <section className="stats-grid">

              {/* SOLDE */}

              <div className="stat-card balance-card">
                <div className="stat-header">
                  <span>
                    Solde total
                  </span>

                  <span className="stat-icon balance-icon">
                    €
                  </span>
                </div>

                <div className="stat-value">
                  {formatEuro(
                    summary?.balance ?? 0,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="positive">
                    ↑ {savingsRate} %
                  </span>

                  <span>
                    taux d'épargne
                  </span>
                </div>
              </div>

              {/* REVENUS */}

              <div className="stat-card">
                <div className="stat-header">
                  <span>
                    Revenus
                  </span>

                  <span className="stat-icon income-icon">
                    ↗
                  </span>
                </div>

                <div className="stat-value">
                  {formatEuro(
                    summary?.income ?? 0,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="positive">
                    ↑
                  </span>

                  <span>
                    ce mois
                  </span>
                </div>
              </div>

              {/* DÉPENSES */}

              <div className="stat-card">
                <div className="stat-header">
                  <span>
                    Dépenses
                  </span>

                  <span className="stat-icon expense-icon">
                    ↘
                  </span>
                </div>

                <div className="stat-value">
                  {formatEuro(
                    summary?.expenses ?? 0,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="negative">
                    ↓
                  </span>

                  <span>
                    ce mois
                  </span>
                </div>
              </div>

              {/* ÉPARGNE */}

              <div className="stat-card">
                <div className="stat-header">
                  <span>
                    Épargne
                  </span>

                  <span className="stat-icon saving-icon">
                    ✦
                  </span>
                </div>

                <div className="stat-value">
                  {formatEuro(
                    savings,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="positive">
                    {savingsRate} %
                  </span>

                  <span>
                    taux d'épargne
                  </span>
                </div>
              </div>

            </section>

            {/* =============================================
                GRAPHIQUES
                ============================================= */}

            <section className="main-grid">

              {/* ÉVOLUTION */}

              <div className="panel chart-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Évolution financière
                    </h2>

                    <p>
                      Votre activité
                      financière
                    </p>
                  </div>

                  <button
                    type="button"
                    className="select-button"
                  >
                    12 mois

                    <span>
                      ⌄
                    </span>
                  </button>
                </div>

                <div className="chart-summary">
                  <div>
                    <strong>
                      {formatEuro(
                        savings,
                      )}
                    </strong>

                    <span>
                      taux d'épargne
                    </span>
                  </div>
                </div>

                <div className="chart">

                  <div className="chart-y-axis">
                    <span>
                      6k
                    </span>

                    <span>
                      4k
                    </span>

                    <span>
                      2k
                    </span>

                    <span>
                      0
                    </span>
                  </div>

                  <div className="chart-area">

                    <div className="grid-line line-1" />
                    <div className="grid-line line-2" />
                    <div className="grid-line line-3" />
                    <div className="grid-line line-4" />

                    <div className="chart-bars">

                      {monthlyData.length >
                      0 ? (
                        monthlyData.map(
                          (
                            item,
                            index,
                          ) => {
                            const income =
                              Number(
                                item.income,
                              );

                            const expenses =
                              Number(
                                item.expenses,
                              );

                            const value =
                              Math.max(
                                income,
                                expenses,
                              );

                            const height =
                              Math.max(
                                (value /
                                  maxMonthlyValue) *
                                  100,
                                5,
                              );

                            return (
                              <div
                                className="bar-wrapper"
                                key={`${item.month}-${index}`}
                              >
                                <div
                                  className="bar"
                                  style={{
                                    height: `${height}%`,
                                  }}
                                />

                                <span>
                                  {formatMonth(
                                    item.month,
                                  )}
                                </span>
                              </div>
                            );
                          },
                        )
                      ) : (
                        <div
                          style={{
                            padding:
                              "40px",
                            color:
                              "#7a8783",
                          }}
                        >
                          Aucune donnée
                          mensuelle
                          disponible.
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>

              {/* DÉPENSES PAR CATÉGORIE */}

              <div className="panel category-panel">

                <div className="panel-header">
                  <div>
                    <h2>
                      Dépenses
                    </h2>

                    <p>
                      Répartition par
                      catégorie
                    </p>
                  </div>

                  <button
                    type="button"
                    className="more-button"
                    aria-label="Plus d'options"
                  >
                    •••
                  </button>
                </div>

                <div className="donut-wrapper">
                  <div className="donut">

                    <div className="donut-center">
                      <strong>
                        {formatEuro(
                          totalCategoryExpenses,
                        )}
                      </strong>

                      <span>
                        total
                      </span>
                    </div>

                  </div>
                </div>

                <div className="category-list">

                  {sortedCategories.length >
                  0 ? (
                    sortedCategories.map(
                      (
                        category,
                        index,
                      ) => {
                        const percentage =
                          totalCategoryExpenses >
                          0
                            ? Math.round(
                                (Number(
                                  category.amount,
                                ) /
                                  totalCategoryExpenses) *
                                  100,
                              )
                            : 0;

                        return (
                          <div
                            className="category-row"
                            key={
                              category.category
                            }
                          >
                            <div className="category-name">

                              <span
                                className={`category-dot dot-${Math.min(
                                  index,
                                  3,
                                )}`}
                              />

                              <span>
                                {
                                  category.category
                                }
                              </span>

                            </div>

                            <div className="category-data">

                              <strong>
                                {formatEuro(
                                  category.amount,
                                )}
                              </strong>

                              <span>
                                {percentage}%
                              </span>

                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div
                      style={{
                        padding:
                          "15px 0",
                        color:
                          "#9aa39f",
                        fontSize:
                          "10px",
                      }}
                    >
                      Aucune dépense
                      enregistrée.
                    </div>
                  )}

                </div>
              </div>

            </section>

            {/* =============================================
                TRANSACTIONS + IA
                ============================================= */}

            <section className="bottom-grid">

              {/* TRANSACTIONS */}

              <div className="panel transactions-panel">

                <div className="panel-header">

                  <div>
                    <h2>
                      Transactions
                      récentes
                    </h2>

                    <p>
                      Vos derniers
                      mouvements
                    </p>
                  </div>

                  <Link
                    href="/transactions"
                    className="link-button"
                  >
                    Voir tout →
                  </Link>

                </div>

                <div className="transactions-list">

                  {recentTransactions.length >
                  0 ? (
                    recentTransactions.map(
                      (
                        transaction,
                      ) => (
                        <div
                          className="transaction-row"
                          key={
                            transaction.id
                          }
                        >

                          <div
                            className={`transaction-icon ${
                              transaction.transaction_type ===
                              "income"
                                ? "income"
                                : "expense"
                            }`}
                          >
                            {getCategoryIcon(
                              transaction.category,
                            )}
                          </div>

                          <div className="transaction-info">
                            <strong>
                              {
                                transaction.description
                              }
                            </strong>

                            <span>
                              {
                                transaction.category
                              }
                            </span>
                          </div>

                          <div
                            className={`transaction-amount ${
                              transaction.transaction_type ===
                              "income"
                                ? "income"
                                : "expense"
                            }`}
                          >
                            {transaction.transaction_type ===
                            "income"
                              ? "+"
                              : "-"}

                            {formatEuro(
                              transaction.amount,
                            )}
                          </div>

                        </div>
                      ),
                    )
                  ) : (
                    <div
                      style={{
                        padding:
                          "45px 20px",
                        textAlign:
                          "center",
                        color:
                          "#9aa39f",
                        fontSize:
                          "11px",
                      }}
                    >
                      Aucune transaction
                      récente.
                    </div>
                  )}

                </div>
              </div>

              {/* FINAI INTELLIGENCE */}

              <div className="ai-card">

                <div className="ai-icon">
                  ✦
                </div>

                <h2>
                  Votre finance,
                  <span>
                    {" "}
                    plus intelligente.
                  </span>
                </h2>

                <p>
                  FinAI analyse vos
                  habitudes financières
                  pour vous aider à mieux
                  comprendre votre argent
                  et prendre de meilleures
                  décisions.
                </p>

                <div className="ai-progress">

                  <div className="ai-progress-header">
                    <span>
                      Analyse de votre
                      situation
                    </span>

                    <strong>
                      {accounts.length >
                      0
                        ? "73%"
                        : "0%"}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-value"
                      style={{
                        width:
                          accounts.length >
                          0
                            ? "73%"
                            : "0%",
                      }}
                    />
                  </div>

                </div>

                <Link
                  href="/insights"
                  className="ai-button"
                >
                  <span>
                    Découvrir FinAI
                  </span>

                  <span>
                    →
                  </span>
                </Link>

              </div>

            </section>
          </>
        )}
      </div>


      {/* =================================================
          CHOIX DE LA SOURCE DES DONNÉES
          ================================================= */}

      {showAddChoice && (
        <div
          onClick={() =>
            setShowAddChoice(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(5, 20, 16, 0.45)",
            backdropFilter:
              "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#fff",
              borderRadius: "24px",
              padding: "30px",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "26px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#00a982",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "2px",
                    marginBottom: "7px",
                  }}
                >
                  AJOUTER UN COMPTE
                </div>

                <h2
                  style={{
                    fontSize: "25px",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Comment souhaitez-vous ajouter votre compte ?
                </h2>

                <p
                  style={{
                    marginTop: "9px",
                    color: "#71817b",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Choisissez entre une saisie manuelle
                  ou une connexion bancaire automatique.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddChoice(false)
                }
                aria-label="Fermer"
                style={{
                  border: "none",
                  background: "#f1f5f3",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAddChoice(false);
                  setManualError(null);
                  setShowManualModal(true);
                }}
                style={{
                  width: "100%",
                  border: "1px solid #dce7e3",
                  borderRadius: "18px",
                  padding: "20px",
                  background: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "#e8f8f3",
                      color: "#00a982",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    ✎
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#101716",
                        fontSize: "16px",
                        marginBottom: "5px",
                      }}
                    >
                      Ajouter manuellement
                    </strong>

                    <span
                      style={{
                        color: "#71817b",
                        fontSize: "13px",
                      }}
                    >
                      Saisissez vous-même les informations
                      de votre compte.
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddChoice(false);
                  setShowBankModal(true);
                }}
                style={{
                  width: "100%",
                  border: "1px solid #dce7e3",
                  borderRadius: "18px",
                  padding: "20px",
                  background: "#f8fcfa",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "#06251c",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "21px",
                      flexShrink: 0,
                    }}
                  >
                    🏦
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#101716",
                        fontSize: "16px",
                        marginBottom: "5px",
                      }}
                    >
                      Connecter ma banque
                    </strong>

                    <span
                      style={{
                        color: "#71817b",
                        fontSize: "13px",
                      }}
                    >
                      Récupérez automatiquement vos comptes
                      et vos transactions.
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          AJOUT MANUEL
          ================================================= */}

      {showManualModal && (
        <div
          onClick={() => {
            if (!manualLoading) {
              setShowManualModal(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(5, 20, 16, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#fff",
              borderRadius: "24px",
              padding: "30px",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#00a982",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "2px",
                    marginBottom: "7px",
                  }}
                >
                  AJOUT MANUEL
                </div>

                <h2
                  style={{
                    fontSize: "25px",
                    margin: 0,
                  }}
                >
                  Ajouter un compte
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#71817b",
                    fontSize: "14px",
                  }}
                >
                  Renseignez les informations de votre compte.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowManualModal(false)
                }
                disabled={manualLoading}
                aria-label="Fermer"
                style={{
                  border: "none",
                  background: "#f1f5f3",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: manualLoading
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();

                if (!userId || !token) {
                  setManualError(
                    "Votre session n'est plus disponible.",
                  );
                  return;
                }

                if (
                  !manualName.trim() ||
                  !manualType ||
                  !manualBalance.trim()
                ) {
                  setManualError(
                    "Veuillez renseigner tous les champs.",
                  );
                  return;
                }

                const balance =
                  Number(manualBalance.replace(",", "."));

                if (!Number.isFinite(balance)) {
                  setManualError(
                    "Veuillez renseigner un solde valide.",
                  );
                  return;
                }

                try {
                  setManualLoading(true);
                  setManualError(null);

                  const response = await fetch(
                    `${API_URL}/users/${userId}/accounts`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                        Accept:
                          "application/json",
                        Authorization:
                          `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        name: manualName.trim(),
                        account_type: manualType,
                        initial_balance: balance,
                      }),
                    },
                  );

                  const data =
                    await response
                      .json()
                      .catch(() => null);

                  if (!response.ok) {
                    throw new Error(
                      data?.detail ??
                        "Impossible de créer le compte.",
                    );
                  }

                  setManualName("");
                  setManualType("");
                  setManualBalance("");
                  setShowManualModal(false);

                  window.location.reload();
                } catch (err) {
                  setManualError(
                    err instanceof Error
                      ? err.message
                      : "Impossible de créer le compte.",
                  );
                } finally {
                  setManualLoading(false);
                }
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "18px",
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#34423d",
                    }}
                  >
                    Nom du compte
                  </span>

                  <input
                    type="text"
                    value={manualName}
                    onChange={(event) =>
                      setManualName(event.target.value)
                    }
                    disabled={manualLoading}
                    required
                    className="input"
                    placeholder="Nom du compte"
                    style={{
                      width: "100%",
                      height: "48px",
                      borderRadius: "12px",
                      border:
                        "1px solid #dfe7e3",
                      padding: "0 14px",
                      outline: "none",
                      background: "#fbfcfb",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#34423d",
                    }}
                  >
                    Type de compte
                  </span>

                  <select
                    value={manualType}
                    onChange={(event) =>
                      setManualType(event.target.value)
                    }
                    disabled={manualLoading}
                    required
                    style={{
                      width: "100%",
                      height: "48px",
                      borderRadius: "12px",
                      border:
                        "1px solid #dfe7e3",
                      padding: "0 14px",
                      outline: "none",
                      background: "#fbfcfb",
                      color: manualType
                        ? "#101716"
                        : "#a8b1ae",
                    }}
                  >
                    <option value="">
                      Sélectionner un type
                    </option>
                    <option value="checking">
                      Compte courant
                    </option>
                    <option value="savings">
                      Compte épargne
                    </option>
                    <option value="cash">
                      Espèces
                    </option>
                    <option value="investment">
                      Investissement
                    </option>
                    <option value="other">
                      Autre
                    </option>
                  </select>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#34423d",
                    }}
                  >
                    Solde actuel
                  </span>

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      value={manualBalance}
                      onChange={(event) =>
                        setManualBalance(
                          event.target.value,
                        )
                      }
                      disabled={manualLoading}
                      required
                      className="input"
                      placeholder="Solde actuel"
                      style={{
                        width: "100%",
                        height: "48px",
                        borderRadius: "12px",
                        border:
                          "1px solid #dfe7e3",
                        padding: "0 45px 0 14px",
                        outline: "none",
                        background: "#fbfcfb",
                      }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        color: "#7b8783",
                        fontWeight: 700,
                      }}
                    >
                      €
                    </span>
                  </div>
                </label>

                {manualError && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "#fff1f2",
                      color: "#be123c",
                      border:
                        "1px solid #fecdd3",
                      fontSize: "13px",
                    }}
                  >
                    {manualError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={manualLoading}
                  style={{
                    width: "100%",
                    height: "50px",
                    border: "none",
                    borderRadius: "12px",
                    background: "#06251c",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: manualLoading
                      ? "not-allowed"
                      : "pointer",
                    opacity: manualLoading
                      ? 0.65
                      : 1,
                  }}
                >
                  {manualLoading
                    ? "Création..."
                    : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          CONNEXION BANCAIRE
          ================================================= */}

      {showBankModal && (
        <div
          onClick={() =>
            setShowBankModal(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(5, 20, 16, 0.45)",
            backdropFilter:
              "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#fff",
              borderRadius: "24px",
              padding: "30px",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#e8f8f3",
                  color: "#00a982",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "25px",
                }}
              >
                🏦
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowBankModal(false)
                }
                aria-label="Fermer"
                style={{
                  border: "none",
                  background: "#f1f5f3",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            <h2
              style={{
                fontSize: "25px",
                margin: "0 0 10px",
              }}
            >
              Connexion bancaire
            </h2>

            <p
              style={{
                color: "#71817b",
                fontSize: "14px",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              La connexion bancaire automatique permettra
              à FinAI de récupérer vos comptes et vos
              transactions afin d’alimenter votre espace
              financier automatiquement.
            </p>

            <div
              style={{
                padding: "15px",
                borderRadius: "14px",
                background: "#f5f8f6",
                color: "#53635d",
                fontSize: "13px",
                lineHeight: 1.5,
                marginBottom: "24px",
              }}
            >
              La connexion bancaire n'est pas encore
              activée. Aucun compte ni aucune transaction
              ne sera récupéré pour le moment.
            </div>

            <button
              type="button"
              onClick={() =>
                setShowBankModal(false)
              }
              style={{
                width: "100%",
                height: "50px",
                border: "none",
                borderRadius: "12px",
                background: "#06251c",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}