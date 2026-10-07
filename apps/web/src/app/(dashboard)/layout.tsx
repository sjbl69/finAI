"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../../context/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    logout,
  } = useAuth();

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const profileRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * =====================================================
   * PROTECTION DU DASHBOARD
   * =====================================================
   */

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  /*
   * =====================================================
   * FERMETURE DU MENU PROFIL
   * =====================================================
   */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node,
        )
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /*
   * =====================================================
   * PENDANT LA VÉRIFICATION DE LA SESSION
   * =====================================================
   */

  if (authLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8f6",
          color: "#7b8783",
          fontSize: "14px",
        }}
      >
        Chargement de votre espace...
      </main>
    );
  }

  /*
   * =====================================================
   * UTILISATEUR NON CONNECTÉ
   * =====================================================
   *
   * Le useEffect ci-dessus redirige vers /login.
   * On n'affiche donc pas le Dashboard.
   */

  if (!user) {
    return null;
  }

  /*
   * =====================================================
   * NAVIGATION ACTIVE
   * =====================================================
   */

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  };

  /*
   * =====================================================
   * NOM UTILISATEUR
   * =====================================================
   */

  const displayName =
    typeof window !== "undefined"
      ? window.localStorage.getItem(
          "finai-user-name",
        ) || "Utilisateur"
      : "Utilisateur";

  const avatarLetter =
    displayName.charAt(0).toUpperCase();

  /*
   * =====================================================
   * DASHBOARD
   * =====================================================
   */

  return (
    <main className="app-shell">
      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="sidebar">

        {/* =================================================
            LOGO
            ================================================= */}

        <div className="brand">
          <div className="brand-mark">
            <span>F</span>
          </div>

          <div>
            <div className="brand-name">
              FinAI
            </div>

            <div className="brand-subtitle">
              Finance intelligente
            </div>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav className="navigation">

          <div className="nav-label">
            MENU
          </div>

          {/* DASHBOARD */}

          <Link
            href="/"
            className={`nav-item ${
              isActive("/")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ⌂
            </span>

            <span>
              Dashboard
            </span>
          </Link>

          {/* COMPTES */}

          <Link
            href="/accounts"
            className={`nav-item ${
              isActive("/accounts")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ◫
            </span>

            <span>
              Mes comptes
            </span>
          </Link>

          {/* TRANSACTIONS */}

          <Link
            href="/transactions"
            className={`nav-item ${
              isActive("/transactions")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ↔
            </span>

            <span>
              Transactions
            </span>
          </Link>

          {/* ANALYTICS */}

          <Link
            href="/analytics"
            className={`nav-item ${
              isActive("/analytics")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ◌
            </span>

            <span>
              Analytics
            </span>
          </Link>

          {/* =================================================
              PERSONNEL
              ================================================= */}

          <div className="nav-label nav-label-spaced">
            PERSONNEL
          </div>

          {/* INSIGHTS */}

          <Link
            href="/insights"
            className={`nav-item ${
              isActive("/insights")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ✦
            </span>

            <span>
              FinAI Insights
            </span>

            <span className="ai-badge">
              AI
            </span>
          </Link>

          {/* PARAMÈTRES */}

          <Link
            href="/settings"
            className={`nav-item ${
              isActive("/settings")
                ? "active"
                : ""
            }`}
          >
            <span className="nav-icon">
              ⚙
            </span>

            <span>
              Paramètres
            </span>
          </Link>

        </nav>

        {/* =================================================
            BAS DE SIDEBAR
            ================================================= */}

        <div className="sidebar-bottom">

          {/* =================================================
              CARTE FINAI INTELLIGENCE
              ================================================= */}

          <div className="upgrade-card">

            <div className="upgrade-icon">
              ✦
            </div>

            <div className="upgrade-title">
              FinAI Intelligence
            </div>

            <p>
              Analysez vos finances avec
              votre assistant IA.
            </p>

            <button type="button">
              Découvrir →
            </button>

          </div>

          {/* =================================================
              PROFIL UTILISATEUR
              ================================================= */}

          <div
            ref={profileRef}
            className="profile"
            style={{
              position: "relative",
            }}
          >

            {/* AVATAR */}

            <div className="avatar">
              {avatarLetter}
            </div>

            {/* INFORMATIONS */}

            <div className="profile-info">

              <strong>
                {displayName}
              </strong>

              <span>
                Compte personnel
              </span>

            </div>

            {/* =================================================
                3 PETITS POINTS
                ================================================= */}

            <button
              type="button"
              className="profile-more"
              onClick={() =>
                setProfileMenuOpen(
                  (current) => !current,
                )
              }
              aria-label="Menu du profil"
              aria-expanded={
                profileMenuOpen
              }
              style={{
                border: "none",
                background:
                  "transparent",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                borderRadius: "8px",
              }}
            >
              •••
            </button>

            {/* =================================================
                MENU PROFIL
                ================================================= */}

            {profileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom:
                    "calc(100% + 10px)",
                  right: 0,
                  width: "210px",
                  padding: "8px",
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e2ebe7",
                  borderRadius:
                    "14px",
                  boxShadow:
                    "0 18px 45px rgba(7,21,16,0.14)",
                  zIndex: 100,
                }}
              >

                {/* =================================================
                    UTILISATEUR CONNECTÉ
                    → UNIQUEMENT DÉCONNEXION
                    ================================================= */}

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(
                      false,
                    );

                    logout();
                  }}
                  style={{
                    width: "100%",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                    padding:
                      "11px 12px",
                    border: "none",
                    borderRadius:
                      "10px",
                    background:
                      "transparent",
                    color:
                      "#c0392b",
                    fontSize:
                      "14px",
                    fontWeight: 600,
                    cursor:
                      "pointer",
                    textAlign:
                      "left",
                  }}
                >
                  <span>
                    ↪
                  </span>

                  <span>
                    Se déconnecter
                  </span>
                </button>

              </div>
            )}

          </div>

        </div>

      </aside>

      {/* =====================================================
          CONTENU PRINCIPAL
          ===================================================== */}

      <section className="content">
        {children}
      </section>

    </main>
  );
}