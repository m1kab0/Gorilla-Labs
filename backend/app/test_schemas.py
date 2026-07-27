import pytest
from pydantic import ValidationError

import schemas


def test_user_create_accepts_valid_email():
    user = schemas.UserCreate(email="test@example.com", password="secret123")
    assert user.email == "test@example.com"


def test_user_create_rejects_invalid_email():
    with pytest.raises(ValidationError):
        schemas.UserCreate(email="not-an-email", password="secret123")


def test_user_create_display_name_is_optional():
    user = schemas.UserCreate(email="test@example.com", password="secret123")
    assert user.display_name is None


def test_set_create_defaults_set_number_to_one():
    s = schemas.SetCreate(exercise_id=1, reps=10)
    assert s.set_number == 1
    assert s.weight_kg is None
    assert s.rpe is None


def test_set_create_requires_reps():
    with pytest.raises(ValidationError):
        schemas.SetCreate(exercise_id=1)


def test_workout_create_allows_all_fields_to_be_omitted():
    w = schemas.WorkoutCreate()
    assert w.workout_date is None
    assert w.notes is None