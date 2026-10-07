from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.repositories.transaction_repository import TransactionRepository


class AIService:
    def __init__(self, session: AsyncSession) -> None:
        self.transaction_repository = TransactionRepository(session)

    async def build_financial_context(
        self,
        account_id: int,
    ) -> dict:
        transactions = (
            await self.transaction_repository.get_by_account_id(
                account_id,
            )
        )

        income = sum(
            (
                transaction.amount
                for transaction in transactions
                if transaction.transaction_type == "income"
            ),
            Decimal("0"),
        )

        expenses = sum(
            (
                abs(transaction.amount)
                for transaction in transactions
                if transaction.transaction_type == "expense"
            ),
            Decimal("0"),
        )

        balance = income - expenses

        categories: dict[str, Decimal] = {}

        for transaction in transactions:
            if transaction.transaction_type != "expense":
                continue

            category = transaction.category

            categories[category] = (
                categories.get(category, Decimal("0"))
                + abs(transaction.amount)
            )

        top_categories = sorted(
            categories.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        return {
            "income": income,
            "expenses": expenses,
            "balance": balance,
            "transaction_count": len(transactions),
            "top_categories": [
                {
                    "category": category,
                    "amount": amount,
                }
                for category, amount in top_categories[:5]
            ],
        }

    async def answer(
        self,
        account_id: int,
        question: str,
    ) -> dict[str, str]:
        context = await self.build_financial_context(
            account_id,
        )

        income = Decimal(str(context["income"]))
        expenses = Decimal(str(context["expenses"]))
        balance = Decimal(str(context["balance"]))
        top_categories = context["top_categories"]

        if income == 0 and expenses == 0:
            return {
                "answer": (
                    "Je n'ai pas encore assez de données pour analyser "
                    "votre situation financière. Ajoutez quelques "
                    "transactions et je pourrai vous aider."
                ),
                "source": "finai",
            }

        question_lower = question.lower()

        # ─────────────────────────────────────────────
        # SOLDE
        # ─────────────────────────────────────────────

        if any(
            word in question_lower
            for word in [
                "solde",
                "combien me reste",
                "reste-t-il",
                "reste il",
            ]
        ):
            if balance >= 0:
                answer = (
                    f"Votre solde calculé est de "
                    f"{balance:.2f} €. "
                    f"Vous avez actuellement "
                    f"{income:.2f} € de revenus pour "
                    f"{expenses:.2f} € de dépenses."
                )
            else:
                answer = (
                    f"Votre situation est actuellement déficitaire "
                    f"de {abs(balance):.2f} €. "
                    f"Vos dépenses atteignent {expenses:.2f} € "
                    f"pour {income:.2f} € de revenus."
                )

            return {
                "answer": answer,
                "source": "finai",
            }

        # ─────────────────────────────────────────────
        # REVENUS
        # ─────────────────────────────────────────────

        if any(
            word in question_lower
            for word in [
                "revenu",
                "salaire",
                "gagne",
                "gagné",
            ]
        ):
            return {
                "answer": (
                    f"Vos revenus enregistrés représentent "
                    f"{income:.2f} €."
                ),
                "source": "finai",
            }

        # ─────────────────────────────────────────────
        # DÉPENSES
        # ─────────────────────────────────────────────

        if any(
            word in question_lower
            for word in [
                "dépense",
                "depense",
                "dépenses",
                "depenses",
                "dépense le plus",
                "dépensé",
                "depense le plus",
            ]
        ):
            if not top_categories:
                answer = (
                    "Je ne dispose pas encore de suffisamment "
                    "de dépenses catégorisées."
                )
            else:
                category = str(top_categories[0]["category"])
                amount = Decimal(
                    str(top_categories[0]["amount"])
                )

                answer = (
                    f"Vous avez actuellement "
                    f"{expenses:.2f} € de dépenses. "
                    f"Votre principale catégorie de dépenses est "
                    f"{category}, avec {amount:.2f} €."
                )

            return {
                "answer": answer,
                "source": "finai",
            }

        # ─────────────────────────────────────────────
        # ÉPARGNE
        # ─────────────────────────────────────────────

        if any(
            word in question_lower
            for word in [
                "épargne",
                "epargne",
                "économiser",
                "economiser",
                "économise",
                "economise",
            ]
        ):
            if income <= 0:
                answer = (
                    "Je ne peux pas encore calculer votre capacité "
                    "d'épargne car aucun revenu n'est enregistré."
                )
            else:
                savings_rate = (
                    balance / income
                ) * Decimal("100")

                if balance > 0:
                    answer = (
                        f"Votre capacité d'épargne actuelle est de "
                        f"{balance:.2f} €, soit environ "
                        f"{savings_rate:.1f} % de vos revenus."
                    )
                else:
                    answer = (
                        "Vos dépenses dépassent actuellement vos "
                        "revenus. Avant de chercher à augmenter "
                        "votre épargne, il serait préférable de "
                        "réduire votre déficit."
                    )

            return {
                "answer": answer,
                "source": "finai",
            }

        # ─────────────────────────────────────────────
        # CATÉGORIES
        # ─────────────────────────────────────────────

        if any(
            word in question_lower
            for word in [
                "catégorie",
                "categorie",
                "catégories",
                "categories",
                "où part",
                "ou part",
            ]
        ):
            if not top_categories:
                answer = (
                    "Je n'ai pas encore de dépenses catégorisées "
                    "à analyser."
                )
            else:
                category_lines = []

                for item in top_categories:
                    category = str(item["category"])
                    amount = Decimal(str(item["amount"]))

                    category_lines.append(
                        f"- {category}: {amount:.2f} €"
                    )

                answer = (
                    "Voici vos principales catégories de dépenses :\n"
                    + "\n".join(category_lines)
                )

            return {
                "answer": answer,
                "source": "finai",
            }

        # ─────────────────────────────────────────────
        # RÉPONSE GÉNÉRALE
        # ─────────────────────────────────────────────

        answer = (
            "Voici ce que je peux actuellement analyser à partir "
            "de vos données :\n\n"
            f"• Revenus : {income:.2f} €\n"
            f"• Dépenses : {expenses:.2f} €\n"
            f"• Solde : {balance:.2f} €\n"
            f"• Transactions : {context['transaction_count']}\n\n"
            "Vous pouvez par exemple me demander : "
            "« Où est-ce que je dépense le plus ? », "
            "« Combien puis-je épargner ? » ou "
            "« Quel est mon solde ? »"
        )

        return {
            "answer": answer,
            "source": "finai",
        }