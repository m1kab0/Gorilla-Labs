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


def test_set_create_requires_reps():
    with pytest.raises(ValidationError):
        schemas.SetCreate(exercise_id=1)


def test_workout_create_allows_all_fields_to_be_omitted():
    w = schemas.WorkoutCreate()
    assert w.workout_date is None
    assert w.notes is None


def test_plan_exercise_create_defaults_order_index_to_zero():
    pe = schemas.PlanExerciseCreate(exercise_id=1)
    assert pe.order_index == 0
    assert pe.target_sets is None
    assert pe.target_reps is None


def test_plan_exercise_create_requires_exercise_id():
    with pytest.raises(ValidationError):
        schemas.PlanExerciseCreate()


def test_workout_plan_create_allows_empty_exercise_list():
    plan = schemas.WorkoutPlanCreate(name="Push day")
    assert plan.exercises == []


def test_workout_plan_create_requires_name():
    with pytest.raises(ValidationError):
        schemas.WorkoutPlanCreate(exercises=[])
