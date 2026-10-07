from fastapi import APIRouter

from finai_api.api.ai import router as ai_router
from finai_api.api.accounts import router as accounts_router
from finai_api.api.auth import router as auth_router
from finai_api.api.dashboard import router as dashboard_router
from finai_api.api.insights import router as insights_router
from finai_api.api.transactions import router as transactions_router
from finai_api.api.users import router as users_router


router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(accounts_router)
router.include_router(transactions_router)
router.include_router(dashboard_router)
router.include_router(insights_router)
router.include_router(ai_router)