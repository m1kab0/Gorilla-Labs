from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- User ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    display_name: Optional[str] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Exercise ----------

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: Optional[str] = None


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    muscle_group: Optional[str] = None
    is_global: bool


# ---------- Set ----------

class SetCreate(BaseModel):
    exercise_id: int
    set_number: int = 1
    reps: int
    weight_kg: Optional[float] = None
    # rpe removed: SetEntry.rpe is currently commented out in models.py


class SetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    set_number: int
    reps: int
    weight_kg: Optional[float] = None


# ---------- Workout ----------

class WorkoutCreate(BaseModel):
    workout_date: Optional[date] = None
    notes: Optional[str] = None


class WorkoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_date: date
    notes: Optional[str] = None
    created_at: datetime
    plan_id: Optional[int] = None
    sets: list[SetOut] = []


# ---------- Plan ----------

class PlanExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int = 0
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None


class PlanExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    order_index: int
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None


class WorkoutPlanCreate(BaseModel):
    name: str
    exercises: list[PlanExerciseCreate] = []


class WorkoutPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    exercises: list[PlanExerciseOut] = []
