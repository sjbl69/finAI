"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "./auth-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Account = {
  id: number;
  name: string;
  account_type: string;
};

type AccountContextValue = {
  userId: number;
  accounts: Account[];
  account: Account | null;
  accountId: number | null;
  loading: boolean;
  error: string | null;
  selectAccount: (accountId: number) => void;
  reloadAccounts: () => Promise<void>;
};

const AccountContext =
  createContext<AccountContextValue | null>(null);

export function AccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    token,
    loading: authLoading,
  } = useAuth();

  const userId = user?.id ?? 0;

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [accountId, setAccountId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function reloadAccounts() {
    /*
     * Pas encore de session utilisateur.
     */
    if (!user || !token) {
      setAccounts([]);
      setAccountId(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/users/${user.id}/accounts`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      /*
       * Session non autorisée.
       */
      if (response.status === 401) {
        throw new Error(
          "Votre session a expiré. Veuillez vous reconnecter.",
        );
      }

      /*
       * Autre erreur API.
       */
      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.detail ??
            `Impossible de récupérer les comptes. (${response.status})`,
        );
      }

      const data: Account[] =
        await response.json();

      setAccounts(data);

      /*
       * Aucun compte bancaire.
       */
      if (data.length === 0) {
        setAccountId(null);
        return;
      }

      /*
       * Identifiant de stockage propre à chaque utilisateur.
       */
      const storageKey =
        `finai-account-id-${user.id}`;

      /*
       * On regarde d'abord l'identifiant sauvegardé
       * par le contexte.
       */
      let savedAccountId =
        window.localStorage.getItem(
          storageKey,
        );

      /*
       * Compatibilité avec l'ancien onboarding
       * qui utilisait "finai-account-id".
       */
      if (!savedAccountId) {
        savedAccountId =
          window.localStorage.getItem(
            "finai-account-id",
          );
      }

      const savedId = savedAccountId
        ? Number(savedAccountId)
        : null;

      /*
       * Vérifie que le compte existe toujours.
       */
      const savedAccountExists =
        savedId !== null &&
        Number.isFinite(savedId) &&
        data.some(
          (account) =>
            account.id === savedId,
        );

      /*
       * Sinon, on prend automatiquement
       * le premier compte.
       */
      const selectedId =
        savedAccountExists &&
        savedId !== null
          ? savedId
          : data[0].id;

      setAccountId(selectedId);

      window.localStorage.setItem(
        storageKey,
        String(selectedId),
      );

      /*
       * Nettoyage de l'ancien stockage.
       */
      window.localStorage.removeItem(
        "finai-account-id",
      );
    } catch (err) {
      console.error(
        "Erreur récupération comptes FinAI:",
        err,
      );

      if (
        err instanceof TypeError &&
        err.message === "Failed to fetch"
      ) {
        setError(
          `Impossible de contacter l'API FinAI (${API_URL}). Vérifiez que le serveur FastAPI est bien démarré.`,
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur est survenue.",
        );
      }

      setAccounts([]);
      setAccountId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void reloadAccounts();
  }, [
    user?.id,
    token,
    authLoading,
  ]);

  function selectAccount(
    nextAccountId: number,
  ) {
    const exists = accounts.some(
      (account) =>
        account.id === nextAccountId,
    );

    if (!exists || !user) {
      return;
    }

    setAccountId(nextAccountId);

    window.localStorage.setItem(
      `finai-account-id-${user.id}`,
      String(nextAccountId),
    );
  }

  const account = useMemo(() => {
    return (
      accounts.find(
        (item) => item.id === accountId,
      ) ?? null
    );
  }, [accounts, accountId]);

  const value = useMemo(
    () => ({
      userId,
      accounts,
      account,
      accountId,
      loading:
        authLoading || loading,
      error,
      selectAccount,
      reloadAccounts,
    }),
    [
      userId,
      accounts,
      account,
      accountId,
      loading,
      authLoading,
      error,
    ],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context =
    useContext(AccountContext);

  if (!context) {
    throw new Error(
      "useAccount doit être utilisé dans un AccountProvider.",
    );
  }

  return context;
}