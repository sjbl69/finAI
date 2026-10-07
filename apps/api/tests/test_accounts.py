from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from finai_api.main import app


@pytest.mark.asyncio
async def test_create_account() -> None:
    email = f"test-{uuid4()}@finai.dev"

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

        response = await client.post(
            f"/users/{user_id}/accounts",
            json={
                "name": "Compte courant",
                "account_type": "checking",
            },
        )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] > 0
    assert data["user_id"] == user_id
    assert data["name"] == "Compte courant"
    assert data["account_type"] == "checking"


@pytest.mark.asyncio
async def test_get_user_accounts() -> None:
    email = f"test-{uuid4()}@finai.dev"

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
                "name": "Compte épargne",
                "account_type": "savings",
            },
        )

        assert account_response.status_code == 201

        response = await client.get(
            f"/users/{user_id}/accounts",
        )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["user_id"] == user_id
    assert data[0]["name"] == "Compte épargne"
    assert data[0]["account_type"] == "savings"