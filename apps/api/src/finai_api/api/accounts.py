from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.database import get_db
from finai_api.api.schemas import AccountCreate, AccountResponse
from finai_api.services.account_service import AccountService

router = APIRouter(
    prefix="/users/{user_id}/accounts",
    tags=["accounts"],
)


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_account(
    user_id: int,
    data: AccountCreate,
    session: AsyncSession = Depends(get_db),
) -> AccountResponse:
    if not data.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom du compte est obligatoire.",
        )

    if data.initial_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le solde initial ne peut pas être négatif.",
        )

    service = AccountService(session)

    account = await service.create(
        user_id=user_id,
        name=data.name.strip(),
        account_type=data.account_type,
        initial_balance=data.initial_balance,
    )

    return AccountResponse.model_validate(account)


@router.get(
    "",
    response_model=list[AccountResponse],
)
async def get_user_accounts(
    user_id: int,
    session: AsyncSession = Depends(get_db),
) -> list[AccountResponse]:
    service = AccountService(session)

    accounts = await service.get_by_user_id(user_id)

    return [
        AccountResponse.model_validate(account)
        for account in accounts
    ]