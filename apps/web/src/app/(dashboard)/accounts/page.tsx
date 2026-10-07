"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/context/account-context";

type Account = {
  id: number;
  name: string;
  account_type: string;
  initial_balance: string;
};

type Summary = {
  income: string;
  expenses: string;
  balance: string;
  transaction_count: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

function formatEuro(value: string | number): string {
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

function getAccountTypeLabel(
  type: string,
): string {
  switch (type.toLowerCase()) {
    case "checking":
      return "Compte courant";

    case "savings":
      return "Compte épargne";

    case "investment":
      return "Investissement";

    case "cash":
      return "Espèces";

    default:
      return type;
  }
}

function getAccountIcon(
  type: string,
): string {
  switch (type.toLowerCase()) {
    case "checking":
      return "€";

    case "savings":
      return "✦";

    case "investment":
      return "↗";

    case "cash":
      return "◈";

    default:
      return "€";
  }
}

export default function AccountsPage() {
  const {
    userId,
    loading: accountLoading,
    error: accountError,
  } = useAccount();

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [summaries, setSummaries] =
    useState<Record<number, Summary>>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [showAddChoice, setShowAddChoice] =
    useState(false);

  const [showBankModal, setShowBankModal] =
    useState(false);

  const [accountName, setAccountName] =
    useState("");

  const [accountType, setAccountType] =
    useState("checking");

  const [initialBalance, setInitialBalance] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    if (!userId) {
      setAccounts([]);
      setSummaries({});
      setLoading(false);
      return;
    }

    void loadAccounts();
  }, [accountLoading, userId]);

  async function loadAccounts() {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/users/${userId}/accounts`,
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les comptes.",
        );
      }

      const data: Account[] =
        await response.json();

      setAccounts(data);

      const summaryEntries =
        await Promise.all(
          data.map(async (account) => {
            try {
              const summaryResponse =
                await fetch(
                  `${API_URL}/users/${userId}/accounts/${account.id}/summary`,
                );

              if (!summaryResponse.ok) {
                return [
                  account.id,
                  {
                    income: "0",
                    expenses: "0",
                    balance:
                      account.initial_balance ??
                      "0",
                    transaction_count: 0,
                  },
                ] as const;
              }

              const summary: Summary =
                await summaryResponse.json();

              return [
                account.id,
                summary,
              ] as const;
            } catch {
              return [
                account.id,
                {
                  income: "0",
                  expenses: "0",
                  balance:
                    account.initial_balance ??
                    "0",
                  transaction_count: 0,
                },
              ] as const;
            }
          }),
        );

      setSummaries(
        Object.fromEntries(
          summaryEntries,
        ),
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createAccount() {
    if (
      !userId ||
      !accountName.trim()
    ) {
      return;
    }

    const parsedInitialBalance =
      Number(
        initialBalance
          .replace(",", ".")
          .trim() || "0",
      );

    if (
      !Number.isFinite(
        parsedInitialBalance,
      ) ||
      parsedInitialBalance < 0
    ) {
      setError(
        "Veuillez saisir un solde valide.",
      );
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/users/${userId}/accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: accountName.trim(),
            account_type: accountType,
            initial_balance:
              parsedInitialBalance,
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
            "Impossible de créer le compte.",
        );
      }

      setAccountName("");
      setAccountType("checking");
      setInitialBalance("");

      setShowModal(false);
      setShowAddChoice(false);

      await loadAccounts();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue.",
      );
    } finally {
      setCreating(false);
    }
  }

  const totalBalance =
    accounts.reduce(
      (total, account) =>
        total +
        Number(
          summaries[account.id]
            ?.balance ?? 0,
        ),
      0,
    );

  const totalIncome =
    accounts.reduce(
      (total, account) =>
        total +
        Number(
          summaries[account.id]
            ?.income ?? 0,
        ),
      0,
    );

  const totalExpenses =
    accounts.reduce(
      (total, account) =>
        total +
        Number(
          summaries[account.id]
            ?.expenses ?? 0,
        ),
      0,
    );

  const finalError =
    accountError || error;

  return (
    <>
      {/* BARRE DU HAUT */}

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
            className="icon-button"
            aria-label="Notifications"
          >
            ♢
            <span className="notification-dot" />
          </button>

          <button className="date-button">
            <span>
              ◷
            </span>

            <span>
              Août 2026
            </span>

            <span className="chevron">
              ⌄
            </span>
          </button>
        </div>
      </header>

      {/* CONTENU */}

      <div className="dashboard">

        {/* HEADER */}

        <section className="welcome">
          <div>
            <div className="eyebrow">
              VOTRE PATRIMOINE
            </div>

            <h1>
              Mes comptes 💳
            </h1>

            <p>
              Gérez et visualisez
              l’ensemble de vos comptes.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowAddChoice(true)
            }
            disabled={!userId}
          >
            <span>
              ＋
            </span>

            Ajouter un compte
          </button>
        </section>

        {/* ERREUR */}

        {finalError && (
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
            {finalError}
          </div>
        )}

        {/* CHARGEMENT */}

        {accountLoading ||
        loading ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#7a8783",
            }}
          >
            Chargement de vos comptes...
          </div>
        ) : (
          <>
            {/* STATISTIQUES */}

            <section className="stats-grid">

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
                    totalBalance,
                  )}
                </div>

                <div className="stat-footer">
                  <span>
                    {accounts.length}
                  </span>

                  <span>
                    compte
                    {accounts.length > 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>

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
                    totalIncome,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="positive">
                    ↑
                  </span>

                  <span>
                    revenus cumulés
                  </span>
                </div>
              </div>

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
                    totalExpenses,
                  )}
                </div>

                <div className="stat-footer">
                  <span className="negative">
                    ↓
                  </span>

                  <span>
                    dépenses cumulées
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span>
                    Comptes
                  </span>

                  <span className="stat-icon saving-icon">
                    ✦
                  </span>
                </div>

                <div className="stat-value">
                  {accounts.length}
                </div>

                <div className="stat-footer">
                  <span className="positive">
                    ●
                  </span>

                  <span>
                    comptes actifs
                  </span>
                </div>
              </div>

            </section>

            {/* LISTE DES COMPTES */}

            <section
              className="panel"
              style={{
                marginTop: "24px",
                padding: "28px",
              }}
            >
              <div
                className="panel-header"
                style={{
                  padding: 0,
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h2>
                    Vos comptes
                  </h2>

                  <p>
                    Vue d’ensemble de vos
                    comptes financiers
                  </p>
                </div>

                <span
                  style={{
                    color: "#00a982",
                    fontWeight: 700,
                  }}
                >
                  {accounts.length} compte
                  {accounts.length > 1
                    ? "s"
                    : ""}
                </span>
              </div>

              {accounts.length === 0 ? (
                <div
                  style={{
                    padding: "50px 20px",
                    textAlign: "center",
                    color: "#7a8783",
                  }}
                >
                  <div
                    style={{
                      fontSize: "42px",
                      marginBottom: "12px",
                    }}
                  >
                    💳
                  </div>

                  <h3
                    style={{
                      marginBottom: "8px",
                      color: "#111",
                    }}
                  >
                    Aucun compte
                  </h3>

                  <p>
                    Ajoutez votre premier
                    compte pour commencer.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {accounts.map(
                    (account) => {
                      const summary =
                        summaries[
                          account.id
                        ];

                      return (
                        <div
                          key={
                            account.id
                          }
                          style={{
                            border:
                              "1px solid #e2ebe7",
                            borderRadius:
                              "18px",
                            padding:
                              "22px",
                            background:
                              "linear-gradient(145deg, #ffffff, #f7fbf9)",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              marginBottom:
                                "24px",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "48px",
                                height:
                                  "48px",
                                borderRadius:
                                  "14px",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  "#e8f8f3",
                                color:
                                  "#00a982",
                                fontWeight:
                                  800,
                                fontSize:
                                  "20px",
                              }}
                            >
                              {getAccountIcon(
                                account.account_type,
                              )}
                            </div>

                            <span
                              style={{
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                                color:
                                  "#6b7c76",
                                background:
                                  "#eef4f1",
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "999px",
                              }}
                            >
                              {getAccountTypeLabel(
                                account.account_type,
                              )}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize:
                                "19px",
                              marginBottom:
                                "8px",
                              color:
                                "#101716",
                            }}
                          >
                            {
                              account.name
                            }
                          </h3>

                          <div
                            style={{
                              fontSize:
                                "30px",
                              fontWeight:
                                800,
                              letterSpacing:
                                "-1px",
                              marginBottom:
                                "20px",
                              color:
                                Number(
                                  summary?.balance ??
                                    0,
                                ) >= 0
                                  ? "#101716"
                                  : "#dc2626",
                            }}
                          >
                            {formatEuro(
                              summary?.balance ??
                                account.initial_balance ??
                                "0",
                            )}
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "1fr 1fr",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                padding:
                                  "12px",
                                borderRadius:
                                  "12px",
                                background:
                                  "#f3faf7",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "block",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#71817b",
                                  marginBottom:
                                    "5px",
                                }}
                              >
                                Revenus
                              </span>

                              <strong
                                style={{
                                  color:
                                    "#00a982",
                                }}
                              >
                                {formatEuro(
                                  summary?.income ??
                                    "0",
                                )}
                              </strong>
                            </div>

                            <div
                              style={{
                                padding:
                                  "12px",
                                borderRadius:
                                  "12px",
                                background:
                                  "#fff7f7",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "block",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#71817b",
                                  marginBottom:
                                    "5px",
                                }}
                              >
                                Dépenses
                              </span>

                              <strong
                                style={{
                                  color:
                                    "#ef6b6b",
                                }}
                              >
                                {formatEuro(
                                  summary?.expenses ??
                                    "0",
                                )}
                              </strong>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop:
                                "16px",
                              paddingTop:
                                "14px",
                              borderTop:
                                "1px solid #e7efec",
                              fontSize:
                                "13px",
                              color:
                                "#71817b",
                            }}
                          >
                            {summary?.transaction_count ??
                              0}{" "}
                            transaction
                            {(summary?.transaction_count ??
                              0) > 1
                              ? "s"
                              : ""}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* CHOIX DE LA SOURCE */}

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
                justifyContent:
                  "space-between",
                alignItems: "center",
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
                  AJOUTER DES DONNÉES
                </div>

                <h2
                  style={{
                    fontSize: "25px",
                    margin: 0,
                  }}
                >
                  Comment souhaitez-vous ajouter votre compte ?
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#71817b",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Choisissez entre une saisie manuelle
                  ou une connexion bancaire.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddChoice(false)
                }
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
              {/* SAISIE MANUELLE */}

              <button
                type="button"
                onClick={() => {
                  setShowAddChoice(false);
                  setShowModal(true);
                }}
                style={{
                  width: "100%",
                  border:
                    "1px solid #dce7e3",
                  borderRadius: "18px",
                  padding: "20px",
                  background: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all .2s ease",
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

              {/* CONNEXION BANCAIRE */}

              <button
                type="button"
                onClick={() => {
                  setShowAddChoice(false);
                  setShowBankModal(true);
                }}
                style={{
                  width: "100%",
                  border:
                    "1px solid #dce7e3",
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
                      fontWeight: 800,
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
                      Synchronisez automatiquement vos
                      comptes et transactions.
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CONNEXION BANCAIRE */}

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
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "#e8f8f3",
                color: "#00a982",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
                marginBottom: "18px",
              }}
            >
              🏦
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
              La connexion bancaire automatique sera
              disponible ici. Elle permettra à FinAI
              de récupérer vos comptes et vos transactions
              afin d’alimenter automatiquement votre Dashboard.
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
              Aucune donnée bancaire n’est récupérée
              pour le moment. Cette étape sera activée
              lorsque la connexion bancaire sera branchée
              à votre service bancaire.
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

      {/* MODALE AJOUT MANUEL */}

      {showModal && (
        <div
          onClick={() =>
            setShowModal(false)
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
                justifyContent:
                  "space-between",
                alignItems: "center",
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
                  NOUVEAU COMPTE
                </div>

                <h2
                  style={{
                    fontSize: "25px",
                    margin: 0,
                  }}
                >
                  Ajouter un compte
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
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

            {/* NOM */}

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Nom du compte
            </label>

            <input
              value={accountName}
              onChange={(event) =>
                setAccountName(
                  event.target.value,
                )
              }
              placeholder="Nom du compte"
              autoFocus
              style={{
                width: "100%",
                height: "50px",
                border:
                  "1px solid #dce7e3",
                borderRadius: "12px",
                padding: "0 15px",
                fontSize: "15px",
                outline: "none",
                marginBottom: "20px",
              }}
            />

            {/* TYPE */}

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Type de compte
            </label>

            <select
              value={accountType}
              onChange={(event) =>
                setAccountType(
                  event.target.value,
                )
              }
              style={{
                width: "100%",
                height: "50px",
                border:
                  "1px solid #dce7e3",
                borderRadius: "12px",
                padding: "0 15px",
                fontSize: "15px",
                outline: "none",
                background: "#fff",
                marginBottom: "20px",
              }}
            >
              <option value="checking">
                Compte courant
              </option>

              <option value="savings">
                Compte épargne
              </option>

              <option value="investment">
                Investissement
              </option>

              <option value="cash">
                Espèces
              </option>
            </select>

            {/* SOLDE INITIAL */}

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Solde actuel
            </label>

            <div
              style={{
                position: "relative",
                marginBottom: "28px",
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                value={initialBalance}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (
                    /^\d*[,.]?\d{0,2}$/.test(
                      value,
                    )
                  ) {
                    setInitialBalance(
                      value,
                    );
                  }
                }}
                placeholder="0,00"
                style={{
                  width: "100%",
                  height: "50px",
                  border:
                    "1px solid #dce7e3",
                  borderRadius: "12px",
                  padding:
                    "0 45px 0 15px",
                  fontSize: "15px",
                  outline: "none",
                }}
              />

              <span
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color: "#71817b",
                  fontWeight: 700,
                }}
              >
                €
              </span>
            </div>

            {/* BOUTONS */}

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                style={{
                  flex: 1,
                  height: "50px",
                  border:
                    "1px solid #dce7e3",
                  borderRadius: "12px",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={createAccount}
                disabled={
                  creating ||
                  !accountName.trim() ||
                  !userId
                }
                className="primary-button"
                style={{
                  flex: 1,
                  justifyContent:
                    "center",
                  opacity:
                    creating ||
                    !accountName.trim() ||
                    !userId
                      ? 0.5
                      : 1,
                  cursor:
                    creating ||
                    !accountName.trim() ||
                    !userId
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {creating
                  ? "Création..."
                  : "Créer le compte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}