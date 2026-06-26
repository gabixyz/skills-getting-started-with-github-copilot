from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_unregister_participant_from_activity():
    email = "newstudent@mergington.edu"

    signup_response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert signup_response.status_code == 200

    unregister_response = client.delete(f"/activities/Chess Club/unregister?email={email}")
    assert unregister_response.status_code == 200
    assert email not in client.get("/activities").json()["Chess Club"]["participants"]
