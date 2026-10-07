from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from finai_api.api.schemas import (
    AccountSummaryResponse,
    CategoryExpenseResponse,
    DashboardResponse,
    MonthlySummaryResponse,
)
from finai_api.database import get_db
from finai_api.services.account_service import AccountService
from finai_api.services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/users/{user_id}/accounts/{account_id}",
    tags=["dashboard"],
)


async def get_owned_account(
    user_id: int,
    account_id: int,
    session: AsyncSession,
):
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

    return account


@router.get(
    "/summary",
    response_model=AccountSummaryResponse,
)
async def get_account_summary(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> AccountSummaryResponse:
    await get_owned_account(user_id, account_id, session)

    dashboard_service = DashboardService(session)

    summary = await dashboard_service.get_account_summary(
        account_id,
    )

    return AccountSummaryResponse(**summary)


@router.get(
    "/categories",
    response_model=list[CategoryExpenseResponse],
)
async def get_expenses_by_category(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> list[CategoryExpenseResponse]:
    await get_owned_account(user_id, account_id, session)

    dashboard_service = DashboardService(session)

    categories = await dashboard_service.get_expenses_by_category(
        account_id,
    )

    return [
        CategoryExpenseResponse(**category)
        for category in categories
    ]


@router.get(
    "/monthly",
    response_model=list[MonthlySummaryResponse],
)
async def get_monthly_summary(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> list[MonthlySummaryResponse]:
    await get_owned_account(user_id, account_id, session)

    dashboard_service = DashboardService(session)

    summaries = await dashboard_service.get_monthly_summary(
        account_id,
    )

    return [
        MonthlySummaryResponse(**summary)
        for summary in summaries
    ]


@router.get(
    "",
    response_model=DashboardResponse,
)
async def get_dashboard(
    user_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    await get_owned_account(user_id, account_id, session)

    dashboard_service = DashboardService(session)

    summary = await dashboard_service.get_account_summary(
        account_id,
    )

    categories = await dashboard_service.get_expenses_by_category(
        account_id,
    )

    monthly = await dashboard_service.get_monthly_summary(
        account_id,
    )

    return DashboardResponse(
        summary=AccountSummaryResponse(**summary),
        categories=[
            CategoryExpenseResponse(**category)
            for category in categories
        ],
        monthly=[
            MonthlySummaryResponse(**item)
            for item in monthly
        ],
    )