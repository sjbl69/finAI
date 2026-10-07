from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from finai_api.db.models import User
from finai_api.repositories.user_repository import UserRepository


pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = UserRepository(session)

    async def get_by_id(
        self,
        user_id: int,
    ) -> User | None:
        return await self.repository.get_by_id(user_id)

    async def get_by_email(
        self,
        email: str,
    ) -> User | None:
        return await self.repository.get_by_email(email)

    def hash_password(
        self,
        password: str,
    ) -> str:
        return pwd_context.hash(password)

    async def create(
        self,
        email: str,
    ) -> User:
        existing_user = await self.repository.get_by_email(email)

        if existing_user is not None:
            return existing_user

        return await self.repository.create(
            email=email,
        )

    async def register(
        self,
        email: str,
        password: str,
    ) -> User:
        existing_user = await self.repository.get_by_email(email)

        if existing_user is not None:
            raise ValueError(
                "Un utilisateur existe déjà avec cet email."
            )

        password_hash = pwd_context.hash(password)

        return await self.repository.create(
            email=email,
            password_hash=password_hash,
        )

    async def verify_password(
        self,
        email: str,
        password: str,
    ) -> User | None:
        user = await self.repository.get_by_email(email)

        if user is None:
            return None

        if not pwd_context.verify(
            password,
            user.password_hash,
        ):
            return None

        return user