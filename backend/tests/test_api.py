"""Regression smoke tests for core InsightFlow data workflows."""

def test_health_check_reports_database_connection(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_feedback_can_be_created_updated_and_deleted(client):
    created = client.post(
        "/api/feedback",
        json={
            "id": "FB-TEST-CRUD",
            "customer": "Test customer",
            "text": "My delivery arrived later than promised.",
            "category": "Delivery",
            "sentiment": "Negative",
            "date": "2026-10-10",
            "source": "Test",
        },
    )

    assert created.status_code == 200
    assert created.json()["id"] == "FB-TEST-CRUD"

    updated = client.patch(
        "/api/feedback/FB-TEST-CRUD",
        json={"sentiment": "Neutral", "category": "Shipping"},
    )
    assert updated.status_code == 200
    assert updated.json()["sentiment"] == "Neutral"
    assert updated.json()["category"] == "Shipping"

    deleted = client.delete("/api/feedback/FB-TEST-CRUD")
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True

    remaining_ids = {
        item["id"] for item in client.get("/api/feedback").json()
    }
    assert "FB-TEST-CRUD" not in remaining_ids


def test_bulk_import_reports_duplicates_and_invalid_rows(client):
    response = client.post(
        "/api/feedback/bulk",
        json=[
            {
                "id": "FB-TEST-BULK",
                "text": "The checkout was easy to use.",
                "category": "Checkout",
                "sentiment": "Positive",
                "date": "2026-10-10",
                "source": "Test CSV",
            },
            {
                "id": "FB-TEST-BULK",
                "text": "This row duplicates the first ID.",
                "category": "Checkout",
                "sentiment": "Neutral",
                "date": "2026-10-10",
                "source": "Test CSV",
            },
            {
                "id": "FB-TEST-INVALID",
                "text": "string",
                "category": "Support",
                "sentiment": "Neutral",
                "date": "2026-10-10",
                "source": "Test CSV",
            },
        ],
    )

    assert response.status_code == 200
    result = response.json()
    assert result["imported"] == 1
    assert result["duplicates_skipped"] == 1
    assert result["invalid_rows"] == 1
    assert len(result["skipped_rows"]) == 2


def test_analytics_are_calculated_from_seeded_feedback(client):
    response = client.get("/api/analytics")

    assert response.status_code == 200
    result = response.json()
    assert result["total"] >= 1
    assert sum(result["sentiment"].values()) == result["total"]
    assert isinstance(result["categories"], list)
    assert isinstance(result["trend"], list)


def test_saved_actions_and_issue_status_persist(client):
    saved = client.put(
        "/api/actions/test-action",
        json={"saved": True},
    )
    assert saved.status_code == 200
    assert saved.json()["saved"] is True

    action_ids = {
        item["action_id"] for item in client.get("/api/actions").json()
    }
    assert "test-action" in action_ids

    updated = client.patch(
        "/api/issues/Delivery%20delays",
        json={"status": "Resolved"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Resolved"

    issues = {
        item["name"]: item["status"]
        for item in client.get("/api/issues").json()
    }
    assert issues["Delivery delays"] == "Resolved"


def test_ai_analysis_explains_missing_gemini_key(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")

    response = client.post("/api/feedback/FB-1024/analyze")

    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]
