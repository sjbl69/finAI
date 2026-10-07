from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from finai_api.main import app


@pytest.mark.asyncio
async def test_create_transaction() -> None:
    email = f"transaction-{uuid4()}@finai.dev"

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

        response = await client.post(
            f"/users/{user_id}/accounts/{account_id}/transactions",
            json={
                "amount": -25.50,
                "description": "Courses",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] > 0
    assert data["account_id"] == account_id
    assert data["amount"] == "-25.50"
    assert data["description"] == "Courses"
    assert data["category"] == "Alimentation"
    assert data["transaction_type"] == "expense"


@pytest.mark.asyncio
async def test_get_account_transactions() -> None:
    email = f"transaction-list-{uuid4()}@finai.dev"

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

        create_response = await client.post(
            f"/users/{user_id}/accounts/{account_id}/transactions",
            json={
                "amount": -50,
                "description": "Restaurant",
                "category": "Alimentation",
                "transaction_type": "expense",
            },
        )

        assert create_response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts/{account_id}/transactions"
        )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["description"] == "Restaurant"
    assert data[0]["account_id"] == account_id


@pytest.mark.asyncio
async def test_transactions_require_account_ownership() -> None:
    email_1 = f"user1-{uuid4()}@finai.dev"
    email_2 = f"user2-{uuid4()}@finai.dev"

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

        response = await client.post(
            f"/users/{user_2_id}/accounts/{account_id}/transactions",
            json={
                "amount": -100,
                "description": "Tentative",
                "category": "Test",
                "transaction_type": "expense",
            },
        )

    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}