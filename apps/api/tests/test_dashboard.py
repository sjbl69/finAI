from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from finai_api.main import app


@pytest.mark.asyncio
async def test_get_account_summary() -> None:
    email = f"dashboard-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        user_response = await client.post(
            "/users",
            json={"email": email},
        )

        assert user_response.status_code == 201
        user_id = user_response.json()["id"]

        account_response = await client.post(
            f"/users/{user_id}/accounts",
            json={
                "name": "Compte courant",
                "account_type": "checking",
            },
        )

        assert account_response.status_code == 201
        account_id = account_response.json()["id"]

        transactions = [
            {
                "amount": 2000,
                "description": "Salaire",
                "category": "Salaire",
                "transaction_type": "income",
            },
            {
                "amount": -500,
                "description": "Loyer",
                "category": "Logement",
                "transaction_type": "expense",
            },
            {
                "amount": -100,
                "description": "Courses",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        ]

        for transaction in transactions:
            response = await client.post(
                f"/users/{user_id}/accounts/{account_id}/transactions",
                json=transaction,
            )

            assert response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts/{account_id}/summary"
        )

    assert response.status_code == 200

    data = response.json()

    assert data["income"] == "2000.00"
    assert data["expenses"] == "600.00"
    assert data["balance"] == "1400.00"
    assert data["transaction_count"] == 3


@pytest.mark.asyncio
async def test_dashboard_requires_account_ownership() -> None:
    email_1 = f"dashboard-user1-{uuid4()}@finai.dev"
    email_2 = f"dashboard-user2-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        user_1_response = await client.post(
            "/users",
            json={"email": email_1},
        )

        user_2_response = await client.post(
            "/users",
            json={"email": email_2},
        )

        assert user_1_response.status_code == 201
        assert user_2_response.status_code == 201

        user_1_id = user_1_response.json()["id"]
        user_2_id = user_2_response.json()["id"]

        account_response = await client.post(
            f"/users/{user_1_id}/accounts",
            json={
                "name": "Compte privé",
                "account_type": "checking",
            },
        )

        assert account_response.status_code == 201
        account_id = account_response.json()["id"]

        response = await client.get(
            f"/users/{user_2_id}/accounts/{account_id}/summary"
        )

    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}


@pytest.mark.asyncio
async def test_get_expenses_by_category() -> None:
    email = f"categories-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        user_response = await client.post(
            "/users",
            json={"email": email},
        )

        assert user_response.status_code == 201
        user_id = user_response.json()["id"]

        account_response = await client.post(
            f"/users/{user_id}/accounts",
            json={
                "name": "Compte courant",
                "account_type": "checking",
            },
        )

        assert account_response.status_code == 201
        account_id = account_response.json()["id"]

        transactions = [
            {
                "amount": -500,
                "description": "Loyer",
                "category": "Logement",
                "transaction_type": "expense",
            },
            {
                "amount": -100,
                "description": "Courses",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
            {
                "amount": -50,
                "description": "Restaurant",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        ]

        for transaction in transactions:
            response = await client.post(
                f"/users/{user_id}/accounts/{account_id}/transactions",
                json=transaction,
            )

            assert response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts/{account_id}/categories"
        )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    categories = {
        item["category"]: item
        for item in data
    }

    assert categories["Logement"]["amount"] == "500.00"
    assert categories["Logement"]["transaction_count"] == 1

    assert categories["Alimentation"]["amount"] == "150.00"
    assert categories["Alimentation"]["transaction_count"] == 2


@pytest.mark.asyncio
async def test_get_monthly_summary() -> None:
    email = f"monthly-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        user_response = await client.post(
            "/users",
            json={"email": email},
        )

        assert user_response.status_code == 201
        user_id = user_response.json()["id"]

        account_response = await client.post(
            f"/users/{user_id}/accounts",
            json={
                "name": "Compte courant",
                "account_type": "checking",
            },
        )

        assert account_response.status_code == 201
        account_id = account_response.json()["id"]

        transactions = [
            {
                "amount": 3000,
                "description": "Salaire",
                "category": "Salaire",
                "transaction_type": "income",
            },
            {
                "amount": -1000,
                "description": "Loyer",
                "category": "Logement",
                "transaction_type": "expense",
            },
            {
                "amount": -200,
                "description": "Courses",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        ]

        for transaction in transactions:
            response = await client.post(
                f"/users/{user_id}/accounts/{account_id}/transactions",
                json=transaction,
            )

            assert response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts/{account_id}/monthly"
        )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1

    month = data[0]

    assert month["income"] == "3000.00"
    assert month["expenses"] == "1200.00"
    assert month["balance"] == "1800.00"

@pytest.mark.asyncio
async def test_get_dashboard() -> None:
    email = f"dashboard-full-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        user_response = await client.post(
            "/users",
            json={"email": email},
        )

        assert user_response.status_code == 201
        user_id = user_response.json()["id"]

        account_response = await client.post(
            f"/users/{user_id}/accounts",
            json={
                "name": "Compte courant",
                "account_type": "checking",
            },
        )

        assert account_response.status_code == 201
        account_id = account_response.json()["id"]

        transactions = [
            {
                "amount": 3000,
                "description": "Salaire",
                "category": "Salaire",
                "transaction_type": "income",
            },
            {
                "amount": -1000,
                "description": "Loyer",
                "category": "Logement",
                "transaction_type": "expense",
            },
            {
                "amount": -200,
                "description": "Courses",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        ]

        for transaction in transactions:
            response = await client.post(
                f"/users/{user_id}/accounts/{account_id}/transactions",
                json=transaction,
            )

            assert response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts/{account_id}"
        )

    assert response.status_code == 200

    data = response.json()

    assert "summary" in data
    assert "categories" in data
    assert "monthly" in data

    assert data["summary"]["income"] == "3000.00"
    assert data["summary"]["expenses"] == "1200.00"
    assert data["summary"]["balance"] == "1800.00"
    assert data["summary"]["transaction_count"] == 3

    categories = {
        item["category"]: item
        for item in data["categories"]
    }

    assert categories["Logement"]["amount"] == "1000.00"
    assert categories["Alimentation"]["amount"] == "200.00"

    assert len(data["monthly"]) == 1
    assert data["monthly"][0]["income"] == "3000.00"
    assert data["monthly"][0]["expenses"] == "1200.00"
    assert data["monthly"][0]["balance"] == "1800.00"