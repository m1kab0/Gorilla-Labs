from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

import models, schemas
from core.database import get_db
from api.deps import get_current_user

router = APIRouter(prefix="/plans", tags=["Plany"])


def _to_plan_exercise_out(plan_exercise: models.PlanExercise) -> schemas.PlanExerciseOut:
    data = schemas.PlanExerciseOut.model_validate(plan_exercise)
    data.exercise_name = plan_exercise.exercise.name if plan_exercise.exercise else None
    return data


def _to_plan_out(plan: models.WorkoutPlan) -> schemas.WorkoutPlanOut:
    out = schemas.WorkoutPlanOut.model_validate(plan)
    out.exercises = [_to_plan_exercise_out(pe) for pe in plan.plan_exercises]
    return out


def _get_owned_plan(plan_id: int, db: Session, current_user: models.User) -> models.WorkoutPlan:
    plan = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.plan_exercises).joinedload(models.PlanExercise.exercise))
        .filter(models.WorkoutPlan.id == plan_id, models.WorkoutPlan.owner_id == current_user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Nie znaleziono planu")
    return plan


@router.get("/", response_model=list[schemas.WorkoutPlanOut])
def list_plans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plans = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.plan_exercises).joinedload(models.PlanExercise.exercise))
        .filter(models.WorkoutPlan.owner_id == current_user.id)
        .order_by(models.WorkoutPlan.created_at.desc())
        .all()
    )
    return [_to_plan_out(p) for p in plans]


@router.post("/", response_model=schemas.WorkoutPlanOut, status_code=201)
def create_plan(
    plan_in: schemas.WorkoutPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exercise_ids = {pe_in.exercise_id for pe_in in plan_in.exercises}
    if exercise_ids:
        found_ids = {
            e.id
            for e in db.query(models.Exercise.id)
            .filter(
                models.Exercise.id.in_(exercise_ids),
                or_(models.Exercise.is_global == True, models.Exercise.owner_id == current_user.id),
            )
            .all()
        }
        if found_ids != exercise_ids:
            raise HTTPException(status_code=404, detail="Nie znaleziono ćwiczenia")

    plan = models.WorkoutPlan(owner_id=current_user.id, name=plan_in.name)
    for pe_in in plan_in.exercises:
        plan.plan_exercises.append(
            models.PlanExercise(
                exercise_id=pe_in.exercise_id,
                order_index=pe_in.order_index,
                target_sets=pe_in.target_sets,
                target_reps=pe_in.target_reps,
            )
        )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _to_plan_out(plan)


@router.get("/{plan_id}", response_model=schemas.WorkoutPlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    return _to_plan_out(plan)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    db.delete(plan)
    db.commit()


@router.post("/{plan_id}/start", response_model=schemas.WorkoutOut, status_code=201)
def start_workout_from_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    workout = models.Workout(
        owner_id=current_user.id,
        workout_date=date.today(),
        plan_id=plan.id,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    out = schemas.WorkoutOut.model_validate(workout)
    out.sets = []
    return out
