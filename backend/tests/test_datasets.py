"""Dataset lifecycle and access-control integration tests."""
from __future__ import annotations

import io


def _login(client, email, password):
    resp = client.post("/api/v1/auth/login/json", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_student_can_create_and_upload(client, seeded):
    headers = _login(client, "aline.uwase@student.ur.ac.rw", "Student#2026")
    create = client.post("/api/v1/datasets", headers=headers, json={
        "title": "Test Sensor Dataset",
        "description": "Sensor readings for testing.",
        "visibility": "public",
        "tags": ["iot", "test"],
    })
    assert create.status_code == 201, create.text
    dataset = create.json()
    assert dataset["slug"].startswith("test-sensor-dataset")
    assert len(dataset["versions"]) == 1
    assert dataset["versions"][0]["version"] == "1.0"

    # Upload a file to the current version.
    upload = client.post(
        f"/api/v1/datasets/{dataset['id']}/files",
        headers=headers,
        files={"files": ("readings.csv", io.BytesIO(b"a,b,c\n1,2,3\n"), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    files = upload.json()
    assert files[0]["filename"] == "readings.csv"
    assert files[0]["checksum_sha256"]


def test_researcher_cannot_upload(client, seeded):
    headers = _login(client, "researcher@ur.ac.rw", "Researcher#2026")
    resp = client.post("/api/v1/datasets", headers=headers, json={"title": "Nope dataset"})
    assert resp.status_code == 403


def test_browse_is_public(client, seeded):
    resp = client.get("/api/v1/datasets")
    assert resp.status_code == 200
    assert "items" in resp.json()


def test_access_request_flow(client, seeded):
    owner = _login(client, "chantal.mukamana@student.ur.ac.rw", "Student#2026")
    created = client.post("/api/v1/datasets", headers=owner, json={
        "title": "Restricted Corpus", "visibility": "restricted",
    })
    dataset_id = created.json()["id"]
    # Approve it so it is visible/public for requesting (owner sees regardless).

    requester = _login(client, "researcher@ur.ac.rw", "Researcher#2026")
    req = client.post(
        f"/api/v1/access-requests/datasets/{dataset_id}",
        headers=requester,
        json={"purpose": "Research", "institution": "UR", "research_area": "NLP"},
    )
    assert req.status_code == 201, req.text
    request_id = req.json()["id"]

    # Owner sees the incoming request.
    incoming = client.get("/api/v1/access-requests/incoming", headers=owner)
    assert incoming.status_code == 200
    assert any(r["id"] == request_id for r in incoming.json())

    # Owner approves with download rights.
    decide = client.post(
        f"/api/v1/access-requests/{request_id}/decide",
        headers=owner,
        json={"approve": True, "access_level": "download", "grant_duration": "permanent"},
    )
    assert decide.status_code == 200
    assert decide.json()["status"] == "approved"
