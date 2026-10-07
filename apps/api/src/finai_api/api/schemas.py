from decimal import Decimal

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    email: EmailStr

    model_config = {
        "from_attributes": True,
    }


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str


class AccountCreate(BaseModel):
    name: str
    account_type: str
    initial_balance: Decimal = Decimal("0")


class AccountResponse(BaseModel):
    id: int
    user_id: int
    name: str
    account_type: str
    initial_balance: Decimal

    model_config = {
        "from_attributes": True,
    }


class TransactionCreate(BaseModel):
    amount: Decimal
    description: str
    category: str
    transaction_type: str


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    amount: Decimal
    description: str
    category: str
    transaction_type: str

    model_config = {
        "from_attributes": True,
    }


class AccountSummaryResponse(BaseModel):
    income: Decimal
    expenses: Decimal
    balance: Decimal
    transaction_count: int


class CategoryExpenseResponse(BaseModel):
    category: str
    amount: Decimal
    transaction_count: int


class MonthlySummaryResponse(BaseModel):
    month: str
    income: Decimal
    expenses: Decimal
    balance: Decimal


class DashboardResponse(BaseModel):
    summary: AccountSummaryResponse
    categories: list[CategoryExpenseResponse]
    monthly: list[MonthlySummaryResponse]


class InsightResponse(BaseModel):
    type: str
    title: str
    message: str
    priority: int


class AIChatRequest(BaseModel):
    question: str


class AIChatResponse(BaseModel):
    answer: str
    source: str