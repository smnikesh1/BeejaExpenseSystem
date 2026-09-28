from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import hashlib

from database import get_connection


app = FastAPI(title="Beeja Expense Management System")




class LoginRequest(BaseModel):
    email: str
    password: str




@app.get("/")
def home():
    return {
        "message": "Beeja Expense Management System API is running"
    }




@app.get("/health")
def health():
    return {
        "status": "healthy"
    }




@app.get("/db-test")
def db_test():
    connection = get_connection()

    cursor = connection.cursor()
    cursor.execute("SELECT DATABASE();")
    result = cursor.fetchone()

    cursor.close()
    connection.close()

    return {
        "database": result[0],
        "status": "connected"
    }




@app.post("/auth/login")
def login(request: LoginRequest):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            employee_code,
            name,
            email,
            password_hash,
            role,
            department
        FROM employees
        WHERE email = %s
        """,
        (request.email,)
    )

    user = cursor.fetchone()

    cursor.close()
    connection.close()

    # User does not exist
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Convert entered password to SHA-256
    entered_password_hash = hashlib.sha256(
        request.password.encode()
    ).hexdigest()

    # Compare password with database hash
    if entered_password_hash != user["password_hash"]:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Never send password hash to frontend
    user.pop("password_hash")

    return {
        "message": "Login successful",
        "user": user
    }




@app.get("/auth/me")
def get_current_user(email: str):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            employee_code,
            name,
            email,
            role,
            department
        FROM employees
        WHERE email = %s
        """,
        (email,)
    )

    user = cursor.fetchone()

    cursor.close()
    connection.close()

    # User not found
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user": user
    }