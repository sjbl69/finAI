from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.db.models import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        email: str,
        password_hash: str | None = None,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash
            or "legacy-user-no-password",
        )

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        return user