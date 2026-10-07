"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAccount } from "@/context/account-context";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  {
    title: "Mes dépenses",
    question: "Où est-ce que je dépense le plus ?",
    icon: "↘",
  },
  {
    title: "Mon solde",
    question: "Quel est mon solde ?",
    icon: "€",
  },
  {
    title: "Mon épargne",
    question: "Combien puis-je épargner ?",
    icon: "✦",
  },
  {
    title: "Mes catégories",
    question: "Où part mon argent ?",
    icon: "◈",
  },
];

export default function ChatPage() {
  const {
    userId,
    account,
    accountId,
    loading: accountLoading,
    error: accountError,
  } = useAccount();

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: 1,
        role: "assistant",
        content:
          "Bonjour 👋 Je suis FinAI, votre assistant financier.\n\nJe peux analyser vos revenus, vos dépenses, votre solde et votre capacité d'épargne à partir des données de votre compte.",
      },
    ]);

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(
    event?: FormEvent,
    suggestedQuestion?: string,
  ) {
    event?.preventDefault();

    const text = (
      suggestedQuestion ?? question
    ).trim();

    if (!text || loading) {
      return;
    }

    if (!userId || !accountId) {
      setError(
        "Aucun compte bancaire sélectionné.",
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/accounts/${accountId}/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: text,
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
            "Impossible d'obtenir une réponse.",
        );
      }

      const data: {
        answer: string;
        source: string;
      } = await response.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "FinAI n'arrive pas à contacter le serveur.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    if (loading) {
      return;
    }

    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Nouvelle conversation 👋\n\nQue souhaitez-vous savoir sur vos finances ?",
      },
    ]);

    setError("");
  }

  const accountUnavailable =
    !accountLoading &&
    (!userId || !accountId);

  return (
    <main className="min-h-[calc(100vh-0px)] bg-[#f5f8f7] text-[#071510]">

      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <header className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06251c] text-xl text-white shadow-lg shadow-[#06251c]/10">
              ✦
            </div>

            <div>

              <div className="flex items-center gap-3">

                <h1 className="text-2xl font-bold tracking-tight">
                  FinAI
                </h1>

                <span className="flex items-center gap-1.5 rounded-full bg-[#e7f8f1] px-2.5 py-1 text-[10px] font-bold text-[#078862]">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00a878]" />

                  EN LIGNE

                </span>

              </div>

              <p className="mt-1 text-xs text-[#87938f]">
                {account
                  ? `Assistant pour « ${account.name} »`
                  : "Votre assistant financier intelligent"}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={clearConversation}
            disabled={loading}
            className="hidden h-10 items-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-4 text-xs font-semibold text-[#71807b] shadow-sm transition hover:text-[#34423d] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
          >
            <span>＋</span>
            Nouvelle conversation
          </button>

        </header>

        {/* CHAT */}

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[#e1e9e5] bg-white shadow-sm">

          {/* CHAT TOPBAR */}

          <div className="flex items-center justify-between border-b border-[#edf1ef] px-5 py-4 sm:px-7">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8f3] text-[#00a878]">
                ✦
              </div>

              <div>

                <p className="text-sm font-bold">
                  Conseiller FinAI
                </p>

                <p className="mt-0.5 text-[11px] text-[#9aa5a2]">
                  {account
                    ? `Analyse basée sur « ${account.name} »`
                    : "Analyse basée sur vos données financières"}
                </p>

              </div>

            </div>

            <div className="hidden items-center gap-2 text-[10px] font-medium text-[#9aa5a2] sm:flex">

              <span className="h-1.5 w-1.5 rounded-full bg-[#00a878]" />

              Données sécurisées

            </div>

          </div>

          {/* MESSAGES */}

          <div className="flex min-h-[500px] flex-1 flex-col overflow-y-auto bg-[#fbfcfc] p-5 sm:p-8">

            <div className="mx-auto flex w-full max-w-[850px] flex-1 flex-col gap-6">

              {/* COMPTE NON DISPONIBLE */}

              {accountUnavailable && (
                <div className="flex justify-center">

                  <div className="max-w-md rounded-2xl border border-[#e4ebe8] bg-white px-6 py-5 text-center shadow-sm">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf7f4] text-[#00a878]">
                      ✦
                    </div>

                    <p className="mt-3 text-sm font-semibold">
                      Aucun compte sélectionné
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#87938f]">
                      Sélectionnez un compte pour
                      permettre à FinAI d'analyser
                      vos finances.
                    </p>

                  </div>

                </div>
              )}

              {/* ACCOUNT ERROR */}

              {accountError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs font-medium text-red-600">
                  {accountError}
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {/* AI AVATAR */}

                  {message.role === "assistant" && (
                    <div className="mr-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f1] text-sm font-bold text-[#00a878]">
                      ✦
                    </div>
                  )}

                  {/* MESSAGE */}

                  <div
                    className={`max-w-[88%] rounded-[22px] px-5 py-4 text-sm leading-7 sm:max-w-[72%] ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#06251c] text-white shadow-sm"
                        : "rounded-bl-md border border-[#e5ece9] bg-white text-[#35423e] shadow-sm"
                    }`}
                  >

                    {message.content
                      .split("\n")
                      .map(
                        (
                          line,
                          index,
                        ) => (
                          <span
                            key={index}
                          >
                            {line}

                            {index <
                              message.content.split(
                                "\n",
                              ).length -
                                1 && (
                              <br />
                            )}
                          </span>
                        ),
                      )}

                  </div>

                </div>
              ))}

              {/* LOADING */}

              {loading && (
                <div className="flex justify-start">

                  <div className="mr-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f1] text-sm font-bold text-[#00a878]">
                    ✦
                  </div>

                  <div className="rounded-[22px] rounded-bl-md border border-[#e5ece9] bg-white px-5 py-4 shadow-sm">

                    <div className="flex items-center gap-1.5">

                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#91aaa2]" />

                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#91aaa2] [animation-delay:150ms]" />

                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#91aaa2] [animation-delay:300ms]" />

                    </div>

                  </div>

                </div>
              )}

              <div ref={messagesEndRef} />

            </div>

          </div>

          {/* SUGGESTIONS */}

          <div className="border-t border-[#edf1ef] bg-white px-5 pt-5 sm:px-7">

            <div className="mx-auto max-w-[850px]">

              <div className="mb-3 flex items-center justify-between">

                <p className="text-xs font-bold text-[#87938f]">
                  Suggestions
                </p>

                <span className="hidden text-[10px] text-[#b0bab7] sm:block">
                  Questions rapides
                </span>

              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                {suggestions.map(
                  (suggestion) => (
                    <button
                      key={
                        suggestion.question
                      }
                      type="button"
                      disabled={
                        loading ||
                        accountUnavailable
                      }
                      onClick={() =>
                        sendMessage(
                          undefined,
                          suggestion.question,
                        )
                      }
                      className="group flex min-h-[62px] items-center gap-3 rounded-2xl border border-[#e2ebe7] bg-[#fafcfb] px-3 text-left transition hover:-translate-y-0.5 hover:border-[#b9ded2] hover:bg-[#edf8f4] disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#00a878] shadow-sm">
                        {
                          suggestion.icon
                        }
                      </span>

                      <span className="min-w-0">

                        <span className="block text-[11px] font-bold text-[#35423e]">
                          {
                            suggestion.title
                          }
                        </span>

                        <span className="mt-0.5 block truncate text-[10px] text-[#9aa5a2]">
                          {
                            suggestion.question
                          }
                        </span>

                      </span>

                    </button>
                  ),
                )}

              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-600 sm:px-7">

              <div className="mx-auto max-w-[850px]">
                {error}
              </div>

            </div>
          )}

          {/* INPUT */}

          <form
            onSubmit={sendMessage}
            className="border-t border-[#edf1ef] bg-white p-4 sm:p-5"
          >

            <div className="mx-auto max-w-[850px]">

              <div className="flex items-end gap-3 rounded-[20px] border border-[#dfe8e4] bg-[#fafcfb] p-2 pl-4 transition focus-within:border-[#91cfbd] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00a878]/5">

                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      if (!loading) {
                        sendMessage();
                      }
                    }
                  }}
                  disabled={
                    loading ||
                    accountUnavailable
                  }
                  rows={1}
                  placeholder={
                    accountUnavailable
                      ? "Sélectionnez d'abord un compte..."
                      : "Posez votre question à FinAI..."
                  }
                  className="max-h-32 min-h-[46px] flex-1 resize-none bg-transparent py-3 text-sm text-[#071510] outline-none placeholder:text-[#a0aaa7] disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={
                    !question.trim() ||
                    loading ||
                    accountUnavailable
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#06251c] text-lg font-bold text-white transition hover:bg-[#0a382c] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#dce6e2] disabled:text-[#9aa5a2]"
                  aria-label="Envoyer le message"
                >
                  ↑
                </button>

              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#a0aaa7]">

                <span>
                  FinAI analyse uniquement les
                  données de votre compte.
                </span>

                <span className="hidden sm:inline">
                  ·
                </span>

                <span className="hidden sm:inline">
                  Entrée pour envoyer
                </span>

              </div>

            </div>

          </form>

        </section>

        {/* MOBILE NEW CHAT */}

        <button
          type="button"
          onClick={clearConversation}
          disabled={loading}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dfe8e4] bg-white text-xs font-semibold text-[#71807b] shadow-sm sm:hidden"
        >
          <span>＋</span>
          Nouvelle conversation
        </button>

      </div>
    </main>
  );
}