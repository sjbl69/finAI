from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from finai_api.database import get_db
from finai_api.services.user_service import UserService


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    service = UserService(session)

    try:
        user = await service.register(
            email=str(data.email),
            password=data.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=str(user.id),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    service = UserService(session)

    user = await service.verify_password(
        email=str(data.email),
        password=data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=str(user.id),
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_current_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    service = UserService(session)

    user = await service.get_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable.",
        )

    return UserResponse.model_validate(user)