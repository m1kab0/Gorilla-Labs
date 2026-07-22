from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/workouts", tags=["Treningi"])


def _to_set_out(set_entry: models.SetEntry) -> schemas.SetOut:
    data = schemas.SetOut.model_validate(set_entry)
    data.exercise_name = set_entry.exercise.name if set_entry.exercise else None
    return data


def _to_workout_out(workout: models.Workout) -> schemas.WorkoutOut:
    out = schemas.WorkoutOut.model_validate(workout)
    out.sets = [_to_set_out(s) for s in workout.sets]
    return out


@router.get("/", response_model=list[schemas.WorkoutOut])
def list_workouts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    workouts = (
        db.query(models.Workout)
        .options(joinedload(models.Workout.sets).joinedload(models.SetEntry.exercise))
        .filter(models.Workout.owner_id == current_user.id)
        .order_by(models.Workout.workout_date.desc(), models.Workout.id.desc())
        .all()
    )
    return [_to_workout_out(w) for w in workouts]


@router.post("/", response_model=schemas.WorkoutOut, status_code=201)
def create_workout(
    workout_in: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    workout = models.Workout(
        owner_id=current_user.id,
        workout_date=workout_in.workout_date or date.today(),
        notes=workout_in.notes,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return _to_workout_out(workout)


def _get_owned_workout(workout_id: int, db: Session, current_user: models.User) -> models.Workout:
    workout = (
        db.query(models.Workout)
        .filter(models.Workout.id == workout_id, models.Workout.owner_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Nie znaleziono treningu")
    return workout


@router.get("/{workout_id}", response_model=schemas.WorkoutOut)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)
    return _to_workout_out(workout)


@router.delete("/{workout_id}", status_code=204)
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)
    db.delete(workout)
    db.commit()


@router.post("/{workout_id}/sets", response_model=schemas.SetOut, status_code=201)
def add_set(
    workout_id: int,
    set_in: schemas.SetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)

    exercise = db.query(models.Exercise).filter(models.Exercise.id == set_in.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Nie znaleziono ćwiczenia")

    set_entry = models.SetEntry(
        workout_id=workout.id,
        exercise_id=set_in.exercise_id,
        set_number=set_in.set_number,
        reps=set_in.reps,
        weight_kg=set_in.weight_kg,
        rpe=set_in.rpe,
    )
    db.add(set_entry)
    db.commit()
    db.refresh(set_entry)
    return _to_set_out(set_entry)


@router.delete("/sets/{set_id}", status_code=204)
def delete_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    set_entry = (
        db.query(models.SetEntry)
        .join(models.Workout)
        .filter(models.SetEntry.id == set_id, models.Workout.owner_id == current_user.id)
        .first()
    )
    if not set_entry:
        raise HTTPException(status_code=404, detail="Nie znaleziono serii")
    db.delete(set_entry)
    db.commit()
