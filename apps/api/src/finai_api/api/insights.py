from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import InsightResponse
from finai_api.database import get_db
from finai_api.services.account_service import AccountService
from finai_api.services.insight_service import InsightService

router = APIRouter(
    prefix="/users/{user_id}/accounts/{account_id}/insights",
    tags=["insights"],
)


@router.get(
    "",
    response_model=list[InsightResponse],
)
async def get_account_insights(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> list[InsightResponse]:
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

    insight_service = InsightService(session)

    insights = await insight_service.get_account_insights(
        account_id,
    )

    return [
        InsightResponse.model_validate(insight)
        for insight in insights
    ]