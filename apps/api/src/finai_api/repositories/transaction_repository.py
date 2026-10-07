from collections import defaultdict
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.db.models import Transaction


class TransactionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self,
        transaction_id: int,
    ) -> Transaction | None:
        result = await self.session.execute(
            select(Transaction).where(
                Transaction.id == transaction_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_by_account_id(
        self,
        account_id: int,
    ) -> list[Transaction]:
        result = await self.session.execute(
            select(Transaction)
            .where(Transaction.account_id == account_id)
            .order_by(Transaction.id)
        )

        return list(result.scalars().all())

    async def create(
        self,
        account_id: int,
        amount: Decimal,
        description: str,
        category: str,
        transaction_type: str,
    ) -> Transaction:
        transaction = Transaction(
            account_id=account_id,
            amount=amount,
            description=description,
            category=category,
            transaction_type=transaction_type,
        )

        self.session.add(transaction)

        await self.session.commit()
        await self.session.refresh(transaction)

        return transaction

    async def get_expenses_by_category(
        self,
        account_id: int,
    ) -> list[dict[str, Decimal | int | str]]:
        transactions = await self.get_by_account_id(account_id)

        categories: dict[str, dict[str, Decimal | int]] = defaultdict(
            lambda: {
                "amount": Decimal("0"),
                "transaction_count": 0,
            }
        )

        for transaction in transactions:
            if transaction.transaction_type != "expense":
                continue

            category = categories[transaction.category]

            category["amount"] = (
                category["amount"] + abs(transaction.amount)
            )

            category["transaction_count"] = (
                category["transaction_count"] + 1
            )

        return [
            {
                "category": category,
                "amount": values["amount"],
                "transaction_count": values["transaction_count"],
            }
            for category, values in categories.items()
        ]

    async def get_monthly_summary(
        self,
        account_id: int,
    ) -> list[dict[str, Decimal | str]]:
        transactions = await self.get_by_account_id(account_id)

        months: dict[str, dict[str, Decimal]] = {}

        for transaction in transactions:
            month = transaction.created_at.strftime("%Y-%m")

            if month not in months:
                months[month] = {
                    "income": Decimal("0"),
                    "expenses": Decimal("0"),
                }

            if transaction.transaction_type == "income":
                months[month]["income"] += transaction.amount

            elif transaction.transaction_type == "expense":
                months[month]["expenses"] += abs(transaction.amount)

        return [
            {
                "month": month,
                "income": values["income"],
                "expenses": values["expenses"],
                "balance": values["income"] - values["expenses"],
            }
            for month, values in sorted(months.items())
        ]