from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.db.models import Account


class AccountRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self,
        account_id: int,
    ) -> Account | None:
        result = await self.session.execute(
            select(Account).where(
                Account.id == account_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: int,
    ) -> list[Account]:
        result = await self.session.execute(
            select(Account)
            .where(Account.user_id == user_id)
            .order_by(Account.id)
        )

        return list(result.scalars().all())

    async def get_by_id_and_user_id(
        self,
        account_id: int,
        user_id: int,
    ) -> Account | None:
        result = await self.session.execute(
            select(Account).where(
                Account.id == account_id,
                Account.user_id == user_id,
            )
        )

        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: int,
        name: str,
        account_type: str,
        initial_balance: Decimal,
    ) -> Account:
        account = Account(
            user_id=user_id,
            name=name,
            account_type=account_type,
            initial_balance=initial_balance,
        )

        self.session.add(account)

        await self.session.commit()
        await self.session.refresh(account)

        return account