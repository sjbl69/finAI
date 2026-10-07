from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import AIChatRequest, AIChatResponse
from finai_api.database import get_db
from finai_api.services.account_service import AccountService
from finai_api.services.ai_service import AIService

router = APIRouter(
    prefix="/users/{user_id}/accounts/{account_id}/ai",
    tags=["ai"],
)


@router.post(
    "/chat",
    response_model=AIChatResponse,
)
async def chat_with_finai(
    user_id: int,
    account_id: int,
    data: AIChatRequest,
    session: AsyncSession = Depends(get_db),
) -> AIChatResponse:
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

    ai_service = AIService(session)

    response = await ai_service.answer(
        account_id=account_id,
        question=data.question,
    )

    return AIChatResponse.model_validate(response)