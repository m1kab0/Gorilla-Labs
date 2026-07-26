from seed_exercises import DEFAULT_EXERCISES


def test_default_exercises_have_name_and_muscle_group():
    assert len(DEFAULT_EXERCISES) > 0
    for name, muscle_group in DEFAULT_EXERCISES:
        assert isinstance(name, str) and name.strip() != ""
        assert isinstance(muscle_group, str) and muscle_group.strip() != ""


def test_default_exercises_have_no_duplicate_names():
    names = [name for name, _ in DEFAULT_EXERCISES]
    assert len(names) == len(set(names))