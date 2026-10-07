from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from finai_api.api.ai import router as ai_router
from finai_api.api.accounts import router as accounts_router
from finai_api.api.auth import router as auth_router
from finai_api.api.dashboard import router as dashboard_router
from finai_api.api.insights import router as insights_router
from finai_api.api.transactions import router as transactions_router
from finai_api.api.users import router as users_router


app = FastAPI(
    title="FinAI API",
    description="AI-powered personal finance copilot",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(accounts_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(insights_router)
app.include_router(ai_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}