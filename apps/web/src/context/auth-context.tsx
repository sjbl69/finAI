"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

type User = {
  id: number;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    firstName: string,
  ) => Promise<void>;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * =========================================================
   * RESTAURATION DE LA SESSION
   * =========================================================
   */

  useEffect(() => {
    try {
      const savedToken =
        window.localStorage.getItem(
          "finai-token",
        );

      const savedUser =
        window.localStorage.getItem(
          "finai-user",
        );

      if (savedToken && savedUser) {
        const parsedUser =
          JSON.parse(savedUser) as User;

        if (
          parsedUser &&
          typeof parsedUser.id === "number" &&
          typeof parsedUser.email === "string"
        ) {
          setToken(savedToken);
          setUser(parsedUser);
        } else {
          clearSession();
        }
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * =========================================================
   * NETTOYAGE DE SESSION
   * =========================================================
   */

  function clearSession() {
    window.localStorage.removeItem(
      "finai-token",
    );

    window.localStorage.removeItem(
      "finai-user",
    );

    window.localStorage.removeItem(
      "finai-user-name",
    );

    window.localStorage.removeItem(
      "finai-account-id",
    );

    setToken(null);
    setUser(null);
  }

  /*
   * =========================================================
   * AUTHENTIFICATION
   * =========================================================
   */

  async function authenticate(
    endpoint: "login" | "register",
    email: string,
    password: string,
    firstName?: string,
  ) {
    const cleanEmail = email.trim();

    const body: {
      email: string;
      password: string;
      first_name?: string;
    } = {
      email: cleanEmail,
      password,
    };

    /*
     * Le backend actuel accepte surtout email/password.
     * On conserve néanmoins le prénom côté frontend.
     */
    if (
      endpoint === "register" &&
      firstName?.trim()
    ) {
      body.first_name =
        firstName.trim();
    }

    let response: Response;

    try {
      response = await fetch(
        `${API_URL}/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        },
      );
    } catch {
      throw new Error(
        "Impossible de contacter le serveur FinAI. Vérifiez que l'API est bien démarrée sur le port 8000.",
      );
    }

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    /*
     * Erreur HTTP renvoyée par FastAPI.
     */
    if (!response.ok) {
      throw new Error(
        data?.detail ??
          `Erreur ${response.status} lors de la connexion.`,
      );
    }

    const nextToken =
      typeof data?.token === "string"
        ? data.token
        : null;

    const nextUser =
      data?.user ?? null;

    if (!nextToken || !nextUser) {
      throw new Error(
        "Réponse invalide du serveur FinAI.",
      );
    }

    /*
     * Vérification minimale de l'utilisateur.
     */
    if (
      typeof nextUser.id !== "number" ||
      typeof nextUser.email !== "string"
    ) {
      throw new Error(
        "Les informations utilisateur reçues sont invalides.",
      );
    }

    /*
     * =======================================================
     * SAUVEGARDE DE LA SESSION
     * =======================================================
     */

    window.localStorage.setItem(
      "finai-token",
      nextToken,
    );

    window.localStorage.setItem(
      "finai-user",
      JSON.stringify(nextUser),
    );

    setToken(nextToken);
    setUser(nextUser);

    /*
     * Sauvegarde du prénom uniquement
     * lors de l'inscription.
     */
    if (
      endpoint === "register" &&
      firstName?.trim()
    ) {
      window.localStorage.setItem(
        "finai-user-name",
        firstName.trim(),
      );
    }
  }

  /*
   * =========================================================
   * CONNEXION
   * =========================================================
   */

  async function login(
    email: string,
    password: string,
  ) {
    await authenticate(
      "login",
      email,
      password,
    );
  }

  /*
   * =========================================================
   * INSCRIPTION
   * =========================================================
   */

  async function register(
    email: string,
    password: string,
    firstName: string,
  ) {
    const cleanFirstName =
      firstName.trim();

    if (!cleanFirstName) {
      throw new Error(
        "Veuillez renseigner votre prénom.",
      );
    }

    if (!email.trim()) {
      throw new Error(
        "Veuillez renseigner votre email.",
      );
    }

    if (!password) {
      throw new Error(
        "Veuillez renseigner un mot de passe.",
      );
    }

    await authenticate(
      "register",
      email,
      password,
      cleanFirstName,
    );
  }

  /*
   * =========================================================
   * DÉCONNEXION
   * =========================================================
   */

  function logout() {
    /*
     * On supprime complètement la session.
     */
    clearSession();

    /*
     * Retour immédiat vers la page de connexion.
     */
    window.location.href = "/login";
  }

  /*
   * =========================================================
   * CONTEXT VALUE
   * =========================================================
   */

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      loading,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
 * ===========================================================
 * HOOK
 * ===========================================================
 */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans un AuthProvider.",
    );
  }

  return context;
}