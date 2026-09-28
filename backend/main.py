
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import hashlib

from database import get_connection


app = FastAPI(title="Beeja Expense Management System")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Pydantic Models
# ============================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class ExpenseCreate(BaseModel):
    employee_id: int
    title: str
    amount: float
    category: str
    expense_date: date
    description: Optional[str] = None
    receipt_url: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    expense_date: Optional[date] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None


class ApprovalRequest(BaseModel):
    manager_id: int
    comment: Optional[str] = None


# ============================================================
# Helper Functions
# ============================================================

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_by_email(email: str):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, employee_code, name, email, role
            FROM employees
            WHERE email = %s
            """,
            (email,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()


def get_user_by_id(user_id: int):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, employee_code, name, email, role
            FROM employees
            WHERE id = %s
            """,
            (user_id,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()


# ============================================================
# Root
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Beeja Expense Management System API is running"
    }


# ============================================================
# AUTH
# ============================================================

@app.post("/auth/login")
def login(request: LoginRequest):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        password_hash = hash_password(request.password)

        cursor.execute(
            """
            SELECT id, employee_code, name, email, role
            FROM employees
            WHERE email = %s
            AND password_hash = %s
            """,
            (request.email, password_hash)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful",
            "user": user
        }

    finally:
        cursor.close()
        connection.close()


@app.get("/auth/me")
def auth_me(user_id: int):

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ============================================================
# EMPLOYEE EXPENSES
# ============================================================

@app.post("/expenses")
def create_expense(expense: ExpenseCreate):

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO expenses
            (
                employee_id,
                title,
                amount,
                category,
                expense_date,
                description,
                receipt_url,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft')
            """,
            (
                expense.employee_id,
                expense.title,
                expense.amount,
                expense.category,
                expense.expense_date,
                expense.description,
                expense.receipt_url
            )
        )

        connection.commit()

        expense_id = cursor.lastrowid

        return {
            "message": "Expense created successfully",
            "expense_id": expense_id
        }

    finally:
        cursor.close()
        connection.close()


@app.get("/expenses")
def get_expenses(employee_id: Optional[int] = None):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        if employee_id:
            cursor.execute(
                """
                SELECT *
                FROM expenses
                WHERE employee_id = %s
                ORDER BY created_at DESC
                """,
                (employee_id,)
            )
        else:
            cursor.execute(
                """
                SELECT *
                FROM expenses
                ORDER BY created_at DESC
                """
            )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT *
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        return expense

    finally:
        cursor.close()
        connection.close()


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate
):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if existing["status"] not in ["draft", "rejected"]:
            raise HTTPException(
                status_code=400,
                detail="Only draft or rejected expenses can be edited"
            )

        update_fields = []
        values = []

        if expense.title is not None:
            update_fields.append("title = %s")
            values.append(expense.title)

        if expense.amount is not None:
            update_fields.append("amount = %s")
            values.append(expense.amount)

        if expense.category is not None:
            update_fields.append("category = %s")
            values.append(expense.category)

        if expense.expense_date is not None:
            update_fields.append("expense_date = %s")
            values.append(expense.expense_date)

        if expense.description is not None:
            update_fields.append("description = %s")
            values.append(expense.description)

        if expense.receipt_url is not None:
            update_fields.append("receipt_url = %s")
            values.append(expense.receipt_url)

        if not update_fields:
            return {
                "message": "No changes provided"
            }

        values.append(expense_id)

        query = f"""
            UPDATE expenses
            SET {", ".join(update_fields)}
            WHERE id = %s
        """

        cursor.execute(query, values)
        connection.commit()

        return {
            "message": "Expense updated successfully"
        }

    finally:
        cursor.close()
        connection.close()


@app.post("/expenses/{expense_id}/submit")
def submit_expense(expense_id: int):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if expense["status"] not in ["draft", "rejected"]:
            raise HTTPException(
                status_code=400,
                detail="Only draft or rejected expenses can be submitted"
            )

        cursor.execute(
            """
            UPDATE expenses
            SET status = 'submitted',
                submitted_at = NOW()
            WHERE id = %s
            """,
            (expense_id,)
        )

        connection.commit()

        return {
            "message": "Expense submitted successfully"
        }

    finally:
        cursor.close()
        connection.close()


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if expense["status"] not in ["draft", "rejected"]:
            raise HTTPException(
                status_code=400,
                detail="Only draft or rejected expenses can be deleted"
            )

        cursor.execute(
            """
            DELETE FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        connection.commit()

        return {
            "message": "Expense deleted successfully"
        }

    finally:
        cursor.close()
        connection.close()


# ============================================================
# MANAGER
# ============================================================

@app.get("/manager/expenses")
def manager_expenses():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                e.*,
                emp.name AS employee_name,
                emp.employee_code AS employee_code
            FROM expenses e
            JOIN employees emp
                ON e.employee_id = emp.id
            WHERE e.status = 'submitted'
            ORDER BY e.submitted_at DESC
            """
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


@app.post("/expenses/{expense_id}/approve")
def approve_expense(
    expense_id: int,
    request: ApprovalRequest
):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if expense["status"] != "submitted":
            raise HTTPException(
                status_code=400,
                detail="Only submitted expenses can be approved"
            )

        cursor.execute(
            """
            UPDATE expenses
            SET status = 'approved'
            WHERE id = %s
            """,
            (expense_id,)
        )

        cursor.execute(
            """
            INSERT INTO approvals
            (
                expense_id,
                manager_id,
                action,
                comment,
                acted_at
            )
            VALUES (%s, %s, 'approved', %s, NOW())
            """,
            (
                expense_id,
                request.manager_id,
                request.comment
            )
        )

        connection.commit()

        return {
            "message": "Expense approved successfully"
        }

    finally:
        cursor.close()
        connection.close()


@app.post("/expenses/{expense_id}/reject")
def reject_expense(
    expense_id: int,
    request: ApprovalRequest
):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if expense["status"] != "submitted":
            raise HTTPException(
                status_code=400,
                detail="Only submitted expenses can be rejected"
            )

        cursor.execute(
            """
            UPDATE expenses
            SET status = 'rejected'
            WHERE id = %s
            """,
            (expense_id,)
        )

        cursor.execute(
            """
            INSERT INTO approvals
            (
                expense_id,
                manager_id,
                action,
                comment,
                acted_at
            )
            VALUES (%s, %s, 'rejected', %s, NOW())
            """,
            (
                expense_id,
                request.manager_id,
                request.comment
            )
        )

        connection.commit()

        return {
            "message": "Expense rejected successfully"
        }

    finally:
        cursor.close()
        connection.close()


# ============================================================
# FINANCE
# ============================================================

@app.get("/finance/expenses")
def finance_expenses():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                e.*,
                emp.name AS employee_name,
                emp.employee_code AS employee_code
            FROM expenses e
            JOIN employees emp
                ON e.employee_id = emp.id
            WHERE e.status = 'approved'
            ORDER BY e.updated_at DESC
            """
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


@app.post("/expenses/{expense_id}/mark-paid")
def mark_paid(expense_id: int):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT status
            FROM expenses
            WHERE id = %s
            """,
            (expense_id,)
        )

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        if expense["status"] != "approved":
            raise HTTPException(
                status_code=400,
                detail="Only approved expenses can be marked as paid"
            )

        cursor.execute(
            """
            UPDATE expenses
            SET status = 'paid'
            WHERE id = %s
            """,
            (expense_id,)
        )

        connection.commit()

        return {
            "message": "Expense marked as paid successfully"
        }

    finally:
        cursor.close()
        connection.close()


@app.get("/finance/summary")
def finance_summary():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Total expenses and total amount
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_expenses,
                COALESCE(SUM(amount), 0) AS total_amount
            FROM expenses
            """
        )

        totals = cursor.fetchone()

        # Status summary
        cursor.execute(
            """
            SELECT
                status,
                COUNT(*) AS count,
                COALESCE(SUM(amount), 0) AS amount
            FROM expenses
            GROUP BY status
            ORDER BY status
            """
        )

        status_summary = cursor.fetchall()

        # Category summary
        cursor.execute(
            """
            SELECT
                category,
                COUNT(*) AS count,
                COALESCE(SUM(amount), 0) AS amount
            FROM expenses
            GROUP BY category
            ORDER BY amount DESC
            """
        )

        category_summary = cursor.fetchall()

        return {
            "total_expenses": totals["total_expenses"],
            "total_amount": float(totals["total_amount"]),
            "status_summary": status_summary,
            "category_summary": category_summary
        }

    finally:
        cursor.close()
        connection.close()


# ============================================================
# Run
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
