from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.db.models import Transaction
from finai_api.repositories.transaction_repository import TransactionRepository


class TransactionService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = TransactionRepository(session)

    async def get_by_id(
        self,
        transaction_id: int,
    ) -> Transaction | None:
        return await self.repository.get_by_id(transaction_id)

    async def get_by_account_id(
        self,
        account_id: int,
    ) -> list[Transaction]:
        return await self.repository.get_by_account_id(account_id)

    async def create(
        self,
        account_id: int,
        amount: Decimal,
        description: str,
        category: str,
        transaction_type: str,
    ) -> Transaction:
        return await self.repository.create(
            account_id=account_id,
            amount=amount,
            description=description,
            category=category,
            transaction_type=transaction_type,
        )