from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import UserCreate, UserResponse
from finai_api.database import get_db
from finai_api.services.user_service import UserService

router = APIRouter()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    data: UserCreate,
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    service = UserService(session)

    user = await service.create(data.email)

    return UserResponse.model_validate(user)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    service = UserService(session)

    user = await service.get_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserResponse.model_validate(user)