from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.repositories.transaction_repository import TransactionRepository


class InsightService:
    def __init__(self, session: AsyncSession) -> None:
        self.transaction_repository = TransactionRepository(session)

    async def get_account_insights(
        self,
        account_id: int,
    ) -> list[dict[str, str | Decimal | int]]:
        transactions = await self.transaction_repository.get_by_account_id(
            account_id,
        )

        if not transactions:
            return [
                {
                    "type": "info",
                    "title": "Commencez votre analyse",
                    "message": (
                        "Ajoutez quelques transactions pour que FinAI "
                        "puisse analyser votre situation financière."
                    ),
                    "priority": 1,
                }
            ]

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

        insights: list[dict[str, str | Decimal | int]] = []

        # ─────────────────────────────────────────────
        # TAUX D'ÉPARGNE
        # ─────────────────────────────────────────────

        if income > 0:
            savings_rate = (balance / income) * Decimal("100")

            if savings_rate < 0:
                insights.append(
                    {
                        "type": "warning",
                        "title": "Vos dépenses dépassent vos revenus",
                        "message": (
                            "Votre situation actuelle est déficitaire. "
                            "FinAI vous recommande d'identifier les catégories "
                            "de dépenses qui peuvent être réduites."
                        ),
                        "priority": 1,
                    }
                )

            elif savings_rate < 10:
                insights.append(
                    {
                        "type": "warning",
                        "title": "Votre marge d'épargne est faible",
                        "message": (
                            f"Votre taux d'épargne est de "
                            f"{savings_rate.quantize(Decimal('0.1'))} %. "
                            "Essayez de réduire certaines dépenses "
                            "pour augmenter votre capacité d'épargne."
                        ),
                        "priority": 2,
                    }
                )

            elif savings_rate < 20:
                insights.append(
                    {
                        "type": "info",
                        "title": "Vous avez une marge de progression",
                        "message": (
                            f"Vous épargnez environ "
                            f"{savings_rate.quantize(Decimal('0.1'))} % "
                            "de vos revenus. Une légère réduction de vos "
                            "dépenses pourrait améliorer votre épargne."
                        ),
                        "priority": 3,
                    }
                )

            else:
                insights.append(
                    {
                        "type": "success",
                        "title": "Bonne capacité d'épargne",
                        "message": (
                            f"Vous épargnez environ "
                            f"{savings_rate.quantize(Decimal('0.1'))} % "
                            "de vos revenus. Continuez à maintenir "
                            "cette discipline financière."
                        ),
                        "priority": 3,
                    }
                )

        # ─────────────────────────────────────────────
        # ANALYSE DES CATÉGORIES
        # ─────────────────────────────────────────────

        category_totals: dict[str, Decimal] = {}

        for transaction in transactions:
            if transaction.transaction_type != "expense":
                continue

            category = transaction.category

            category_totals[category] = (
                category_totals.get(category, Decimal("0"))
                + abs(transaction.amount)
            )

        if category_totals and expenses > 0:
            biggest_category = max(
                category_totals,
                key=category_totals.get,
            )

            biggest_amount = category_totals[biggest_category]

            category_percentage = (
                biggest_amount / expenses
            ) * Decimal("100")

            if category_percentage >= 30:
                insights.append(
                    {
                        "type": "warning",
                        "title": (
                            f"{biggest_category} représente une "
                            "grande partie de vos dépenses"
                        ),
                        "message": (
                            f"Vous avez dépensé "
                            f"{biggest_amount.quantize(Decimal('0.01'))} € "
                            f"dans la catégorie {biggest_category}, soit "
                            f"{category_percentage.quantize(Decimal('0.1'))} % "
                            "de vos dépenses."
                        ),
                        "priority": 2,
                    }
                )

            else:
                insights.append(
                    {
                        "type": "info",
                        "title": f"{biggest_category} est votre première dépense",
                        "message": (
                            f"{biggest_category} représente "
                            f"{category_percentage.quantize(Decimal('0.1'))} % "
                            "de vos dépenses totales."
                        ),
                        "priority": 4,
                    }
                )

        # ─────────────────────────────────────────────
        # NOMBRE DE TRANSACTIONS
        # ─────────────────────────────────────────────

        expense_transactions = [
            transaction
            for transaction in transactions
            if transaction.transaction_type == "expense"
        ]

        if len(expense_transactions) >= 10:
            insights.append(
                {
                    "type": "info",
                    "title": "Vous avez beaucoup de mouvements",
                    "message": (
                        f"FinAI a identifié "
                        f"{len(expense_transactions)} dépenses. "
                        "Une analyse régulière de vos transactions "
                        "peut vous aider à mieux contrôler votre budget."
                    ),
                    "priority": 5,
                }
            )

        # ─────────────────────────────────────────────
        # PREMIÈRE TRANSACTION
        # ─────────────────────────────────────────────

        if len(transactions) <= 3:
            insights.append(
                {
                    "type": "info",
                    "title": "Continuez à enregistrer vos transactions",
                    "message": (
                        "Plus FinAI dispose de données, plus ses analyses "
                        "et recommandations pourront être précises."
                    ),
                    "priority": 6,
                }
            )

        insights.sort(
            key=lambda insight: int(insight["priority"]),
        )

        return insights