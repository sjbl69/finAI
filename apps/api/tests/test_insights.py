from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from finai_api.main import app


@pytest.mark.asyncio
async def test_get_account_insights() -> None:
    email = f"insights-{uuid4()}@finai.dev"

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
                "amount": -500,
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
            f"/users/{user_id}/accounts/{account_id}/insights"
        )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    for insight in data:
        assert "type" in insight
        assert "title" in insight
        assert "message" in insight
        assert "priority" in insight

        assert isinstance(insight["type"], str)
        assert isinstance(insight["title"], str)
        assert isinstance(insight["message"], str)
        assert isinstance(insight["priority"], int)

    titles = [insight["title"] for insight in data]

    assert any(
        "épargne" in title.lower()
        for title in titles
    )


@pytest.mark.asyncio
async def test_insights_requires_account_ownership() -> None:
    email_1 = f"insights-user1-{uuid4()}@finai.dev"
    email_2 = f"insights-user2-{uuid4()}@finai.dev"

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
            f"/users/{user_2_id}/accounts/{account_id}/insights"
        )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Account not found",
    }