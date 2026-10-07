from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.repositories.account_repository import AccountRepository
from finai_api.repositories.transaction_repository import TransactionRepository


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.account_repository = AccountRepository(session)
        self.transaction_repository = TransactionRepository(session)

    async def get_account_summary(
        self,
        account_id: int,
    ) -> dict[str, Decimal | int]:
        account = await self.account_repository.get_by_id(
            account_id,
        )

        if account is None:
            return {
                "income": Decimal("0"),
                "expenses": Decimal("0"),
                "balance": Decimal("0"),
                "transaction_count": 0,
            }

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

        balance = (
            account.initial_balance
            + income
            - expenses
        )

        return {
            "income": income,
            "expenses": expenses,
            "balance": balance,
            "transaction_count": len(transactions),
        }

    async def get_expenses_by_category(
        self,
        account_id: int,
    ) -> list[dict[str, Decimal | int | str]]:
        return await self.transaction_repository.get_expenses_by_category(
            account_id,
        )

    async def get_monthly_summary(
        self,
        account_id: int,
    ) -> list[dict]:
        return await self.transaction_repository.get_monthly_summary(
            account_id,
        )