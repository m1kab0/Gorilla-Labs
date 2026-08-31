"""
Jednorazowy skrypt wypełniający bazę popularnymi, globalnymi ćwiczeniami.
Uruchom po migracjach: python -m scripts.seed_exercises
"""
from core.database import SessionLocal
import models

DEFAULT_EXERCISES = [
    # Klatka piersiowa
    ("Wyciskanie sztangi na ławce płaskiej", "klatka piersiowa"),
    ("Wyciskanie sztangi na ławce skos dodatni", "klatka piersiowa"),
    ("Wyciskanie sztangi na ławce skos ujemny", "klatka piersiowa"),
    ("Wyciskanie hantli na ławce płaskiej", "klatka piersiowa"),
    ("Wyciskanie hantli na ławce skos dodatni", "klatka piersiowa"),
    ("Rozpiętki z hantlami", "klatka piersiowa"),
    ("Rozpiętki na wyciągu (cable fly)", "klatka piersiowa"),
    ("Pompki", "klatka piersiowa"),
    ("Dipy na poręczach", "klatka piersiowa"),
    ("Wyciskanie na maszynie (chest press)", "klatka piersiowa"),
    ("Pull-over z hantlą", "klatka piersiowa"),
    # Plecy
    ("Martwy ciąg", "plecy"),
    ("Podciąganie na drążku", "plecy"),
    ("Podciąganie podchwytem", "plecy"),
    ("Wiosłowanie sztangą", "plecy"),
    ("Wiosłowanie hantlą w opadzie tułowia", "plecy"),
    ("Wiosłowanie na wyciągu dolnym siedząc", "plecy"),
    ("Ściąganie drążka wyciągu górnego (lat pulldown)", "plecy"),
    ("Wiosłowanie T-bar", "plecy"),
    ("Hiperekstensje", "plecy"),
    # Barki
    ("Wyciskanie żołnierskie (OHP)", "barki"),
    ("Wyciskanie hantli nad głowę siedząc", "barki"),
    ("Wznosy hantli bokiem", "barki"),
    ("Wznosy hantli w opadzie (tylny akton)", "barki"),
    ("Wznosy hantli przodem", "barki"),
    ("Uginanie wyciągu do twarzy (face pull)", "barki"),
    # Biceps
    ("Uginanie ramion ze sztangą", "biceps"),
    ("Uginanie ramion z hantlami (młotkowe)", "biceps"),
    ("Uginanie ramion na modlitewniku", "biceps"),
    ("Uginanie ramion na wyciągu dolnym", "biceps"),
    ("Uginanie koncentryczne z hantlą", "biceps"),
    # Triceps
    ("Wyciskanie francuskie", "triceps"),
    ("Prostowanie ramion na wyciągu górnym", "triceps"),
    ("Wyciskanie sztangi wąskim chwytem", "triceps"),
    ("Prostowanie ramienia znad głowy z hantlą", "triceps"),
    ("Wyprosty ramienia w opadzie (kickback)", "triceps"),
    # Przedramiona
    ("Uginanie nadgarstków ze sztangą", "przedramiona"),
    ("Prostowanie nadgarstków ze sztangą", "przedramiona"),
    ("Spacer farmera (farmer's walk)", "przedramiona"),
    # Brzuch
    ("Plank", "brzuch"),
    ("Brzuszki", "brzuch"),
    ("Unoszenie nóg w zwisie", "brzuch"),
    ("Wykroki na kole (ab wheel rollout)", "brzuch"),
    ("Skręty tułowia z obciążeniem (russian twist)", "brzuch"),
    ("Mountain climbers", "brzuch"),
    # Nogi
    ("Przysiad ze sztangą", "nogi"),
    ("Przysiad przedni ze sztangą", "nogi"),
    ("Wykroki", "nogi"),
    ("Przysiad bułgarski", "nogi"),
    ("Wyciskanie nogami na suwnicy (leg press)", "nogi"),
    ("Prostowanie nóg siedząc", "nogi"),
    ("Uginanie nóg leżąc", "nogi"),
    ("Martwy ciąg rumuński (RDL)", "nogi"),
    # Pośladki
    ("Hip thrust", "pośladki"),
    ("Odwodzenie bioder na maszynie", "pośladki"),
    # Łydki
    ("Wspięcia na palce stojąc", "łydki"),
    ("Wspięcia na palce siedząc", "łydki"),
]


def run():
    db = SessionLocal()
    try:
        canonical = dict(DEFAULT_EXERCISES)
        existing = {e.name: e for e in db.query(models.Exercise).filter(models.Exercise.is_global == True)}
        added = 0
        fixed = 0
        for name, muscle_group in DEFAULT_EXERCISES:
            if name not in existing:
                db.add(models.Exercise(name=name, muscle_group=muscle_group, is_global=True, owner_id=None))
                added += 1
        # Normalizuje partie ciała istniejących ćwiczeń, których etykieta odbiega
        # od aktualnej, kanonicznej wartości (np. sprzed tego rozszerzenia listy).
        for name, exercise in existing.items():
            target = canonical.get(name)
            if target is not None and exercise.muscle_group != target:
                exercise.muscle_group = target
                fixed += 1
        db.commit()
        print(f"Dodano {added} nowych globalnych ćwiczeń, znormalizowano {fixed} istniejących.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
