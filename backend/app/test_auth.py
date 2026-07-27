import time

from jose import jwt

from core import security
from core.config import settings


def test_hash_password_produces_different_hash_each_time():
    #bcrypt losuje seed, więc identyczne hasło daje różne hashe.
    hashed1 = security.hash_password("mypassword123")
    hashed2 = security.hash_password("mypassword123")
    assert hashed1 != hashed2


def test_verify_password_accepts_correct_password():
    hashed = security.hash_password("correct-horse-battery-staple")
    assert security.verify_password("correct-horse-battery-staple", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = security.hash_password("correct-horse-battery-staple")
    assert security.verify_password("wrong-password", hashed) is False


def test_create_access_token_contains_subject_and_is_decodable():
    token = security.create_access_token(data={"sub": "42"})
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "42"
    assert "exp" in payload


def test_create_access_token_expiry_is_in_the_future():
    token = security.create_access_token(data={"sub": "1"})
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["exp"] > time.time()
