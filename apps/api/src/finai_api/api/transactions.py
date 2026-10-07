from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import TransactionCreate, TransactionResponse
from finai_api.database import get_db
from finai_api.services.account_service import AccountService
from finai_api.services.transaction_service import TransactionService

router = APIRouter(
    prefix="/users/{user_id}/accounts/{account_id}/transactions",
    tags=["transactions"],
)


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction(
    user_id: int,
    account_id: int,
    data: TransactionCreate,
    session: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    account_service = AccountService(session)

    account = await account_service.get_by_id_and_user_id(
        account_id=account_id,
        user_id=user_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    transaction_service = TransactionService(session)

    transaction = await transaction_service.create(
        account_id=account_id,
        amount=data.amount,
        description=data.description,
        category=data.category,
        transaction_type=data.transaction_type,
    )

    return TransactionResponse.model_validate(transaction)


@router.get(
    "",
    response_model=list[TransactionResponse],
)
async def get_account_transactions(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> list[TransactionResponse]:
    account_service = AccountService(session)

    account = await account_service.get_by_id_and_user_id(
        account_id=account_id,
        user_id=user_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    transaction_service = TransactionService(session)

    transactions = await transaction_service.get_by_account_id(
        account_id,
    )

    return [
        TransactionResponse.model_validate(transaction)
        for transaction in transactions
    ]