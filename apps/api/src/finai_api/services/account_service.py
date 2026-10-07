from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.db.models import Account
from finai_api.repositories.account_repository import AccountRepository


class AccountService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = AccountRepository(session)

    async def get_by_id(
        self,
        account_id: int,
    ) -> Account | None:
        return await self.repository.get_by_id(account_id)

    async def get_by_user_id(
        self,
        user_id: int,
    ) -> list[Account]:
        return await self.repository.get_by_user_id(user_id)

    async def get_by_id_and_user_id(
        self,
        account_id: int,
        user_id: int,
    ) -> Account | None:
        return await self.repository.get_by_id_and_user_id(
            account_id=account_id,
            user_id=user_id,
        )

    async def create(
        self,
        user_id: int,
        name: str,
        account_type: str,
        initial_balance: Decimal,
    ) -> Account:
        return await self.repository.create(
            user_id=user_id,
            name=name,
            account_type=account_type,
            initial_balance=initial_balance,
        )