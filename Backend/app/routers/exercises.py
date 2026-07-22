from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/exercises", tags=["Ćwiczenia"])


@router.get("/", response_model=list[schemas.ExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Zwraca ćwiczenia globalne + własne ćwiczenia użytkownika."""
    return (
        db.query(models.Exercise)
        .filter(or_(models.Exercise.is_global == True, models.Exercise.owner_id == current_user.id))
        .order_by(models.Exercise.name)
        .all()
    )


@router.post("/", response_model=schemas.ExerciseOut, status_code=201)
def create_exercise(
    exercise_in: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    exercise = models.Exercise(
        name=exercise_in.name,
        muscle_group=exercise_in.muscle_group,
        owner_id=current_user.id,
        is_global=False,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    exercise = (
        db.query(models.Exercise)
        .filter(models.Exercise.id == exercise_id, models.Exercise.owner_id == current_user.id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Nie znaleziono ćwiczenia (lub jest globalne, nie można usunąć)")
    db.delete(exercise)
    db.commit()
