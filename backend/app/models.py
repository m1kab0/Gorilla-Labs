from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workouts = relationship("Workout", back_populates="owner", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="owner", cascade="all, delete-orphan")
    workout_plans = relationship("WorkoutPlan", back_populates="owner", cascade="all, delete-orphan")


class Exercise(Base):
    """Ćwiczenie - może być globalne (owner_id=None) albo dodane przez usera."""

    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    muscle_group = Column(String, nullable=True)  # np. "nogi", "klatka", "plecy"
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = globalne ćwiczenie
    is_global = Column(Boolean, default=False)

    owner = relationship("User", back_populates="exercises")
    sets = relationship("SetEntry", back_populates="exercise")


class Workout(Base):
    """Pojedyncza sesja treningowa."""

    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    plan_id = Column(Integer, ForeignKey("workout_plans.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User", back_populates="workouts")
    sets = relationship("SetEntry", back_populates="workout", cascade="all, delete-orphan", order_by="SetEntry.id")


class SetEntry(Base):
    """Pojedyncza seria w treningu: konkretne ćwiczenie x powtórzenia x ciężar."""

    __tablename__ = "set_entries"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)

    set_number = Column(Integer, nullable=False, default=1)
    reps = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=True)
    rpe = Column(Float, nullable=True)  # subiektywne odczucie wysiłku (opcjonalne, 1-10)

    workout = relationship("Workout", back_populates="sets")
    exercise = relationship("Exercise", back_populates="sets")


class WorkoutPlan(Base):
    """Szablon treningu: lista ćwiczeń z docelową liczbą serii/powtórzeń."""

    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workout_plans")
    plan_exercises = relationship(
        "PlanExercise",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PlanExercise.order_index",
    )


class PlanExercise(Base):
    """Pojedyncze ćwiczenie w planie, z docelową liczbą serii/powtórzeń."""

    __tablename__ = "plan_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    target_sets = Column(Integer, nullable=True)
    target_reps = Column(Integer, nullable=True)

    plan = relationship("WorkoutPlan", back_populates="plan_exercises")
    exercise = relationship("Exercise")
