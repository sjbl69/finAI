from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from finai_api.main import app


@pytest.mark.asyncio
async def test_health_check() -> None:
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_user() -> None:
    email = f"test-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/users",
            json={"email": email},
        )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] > 0
    assert data["email"] == email


@pytest.mark.asyncio
async def test_get_user() -> None:
    email = f"test-{uuid4()}@finai.dev"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        create_response = await client.post(
            "/users",
            json={"email": email},
        )

        assert create_response.status_code == 201

        user_id = create_response.json()["id"]

        response = await client.get(f"/users/{user_id}")

    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["email"] == email


@pytest.mark.asyncio
async def test_get_unknown_user() -> None:
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.get("/users/999999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


@pytest.mark.asyncio
async def test_create_user_invalid_email() -> None:
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/users",
            json={"email": "not-an-email"},
        )

    assert response.status_code == 422