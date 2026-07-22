"""
Jednorazowy skrypt wypełniający bazę popularnymi, globalnymi ćwiczeniami.
Uruchom po migracjach: python -m app.seed_exercises
"""
from app.database import SessionLocal
from app import models

DEFAULT_EXERCISES = [
    ("Przysiad ze sztangą", "nogi"),
    ("Martwy ciąg", "plecy/nogi"),
    ("Wyciskanie sztangi na ławce płaskiej", "klatka piersiowa"),
    ("Wyciskanie sztangi na ławce skos dodatni", "klatka piersiowa"),
    ("Wyciskanie żołnierskie (OHP)", "barki"),
    ("Podciąganie na drążku", "plecy"),
    ("Wiosłowanie sztangą", "plecy"),
    ("Uginanie ramion ze sztangą", "biceps"),
    ("Wyciskanie francuskie", "triceps"),
    ("Wykroki", "nogi"),
    ("Hip thrust", "pośladki"),
    ("Plank", "brzuch"),
    ("Wznosy hantli bokiem", "barki"),
    ("Dipy na poręczach", "triceps/klatka"),
    ("Uginanie nóg leżąc", "nogi (dwugłowy)"),
    ("Prostowanie nóg siedząc", "nogi (czworogłowy)"),
]


def run():
    db = SessionLocal()
    try:
        existing_names = {e.name for e in db.query(models.Exercise).filter(models.Exercise.is_global == True)}
        added = 0
        for name, muscle_group in DEFAULT_EXERCISES:
            if name in existing_names:
                continue
            db.add(models.Exercise(name=name, muscle_group=muscle_group, is_global=True, owner_id=None))
            added += 1
        db.commit()
        print(f"Dodano {added} nowych globalnych ćwiczeń.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
