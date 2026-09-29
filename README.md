# Beeja Expense Management System

A full-stack Expense Report Management System built for the Beeja AI Solutions technical assessment.

The system allows employees to create and submit expense claims, managers to review and approve/reject claims, and finance administrators to mark approved expenses as paid.

## Technology Stack

* **Backend:** FastAPI, Python
* **Web:** React, Vite
* **Mobile:** React Native, Expo
* **Database:** MySQL 8.x
* **API Testing:** Swagger / OpenAPI
* **Containerization:** Docker, Docker Compose
* **Version Control:** Git and GitHub

## Project Structure

```text
BeejaExpenseSystem/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
├── web/
│   ├── Dockerfile
│   └── ...
├── mobile/
├── db/
│   └── schema.sql
├── docker-compose.yml
├── README.md
└── .gitignore
```

## System Architecture

```text
React Web App ───────┐
                     │
React Native App ────┼──> FastAPI Backend ───> MySQL
                     │
                     └──> REST APIs
```

The FastAPI backend acts as the single source of truth for business data.

## User Roles

### Employee

* Login
* Create expense claims
* Add expense details
* Submit expenses
* View expense status
* Edit rejected expenses
* Resubmit rejected expenses
* Track paid expenses

### Manager

* View submitted expenses
* Review expense details
* Approve expenses
* Reject expenses with comments
* View team expense information

### Finance Admin

* View approved expenses
* Filter expense records
* Mark approved expenses as paid
* View financial summary information

## Database

The database contains the following main tables:

* `employees`
* `expenses`
* `approvals`

The complete database schema and seed data are available in:

```text
db/schema.sql
```

## Prerequisites

### For Local Development

Install:

* Python 3.x
* Node.js and npm
* MySQL 8.x
* Git
* Expo / React Native development environment

### For Docker

Install:

* Docker Desktop

## Database Setup — Local

1. Start MySQL.

2. Open MySQL Workbench or MySQL command line.

3. Run the SQL script:

```text
db/schema.sql
```

This creates the database, tables, and seed data.

## Backend Setup — Local

Open PowerShell:

```powershell
cd "BeejaExpenseSystem\backend"
```

Create and activate the virtual environment if required:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder with your local MySQL configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=beeja_expense_db
```

Do not commit the `.env` file to GitHub.

Start the FastAPI server:

```powershell
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

## Web Setup — Local

Open another terminal:

```powershell
cd "BeejaExpenseSystem\web"
```

Install dependencies:

```powershell
npm install
```

Start the React web application:

```powershell
npm run dev
```

The web application will normally run at:

```text
http://localhost:5173
```

The web application provides Manager and Finance Admin functionality.

## Mobile Setup — Local

Open another terminal:

```powershell
cd "BeejaExpenseSystem\mobile"
```

Install dependencies:

```powershell
npm install
```

Start Expo:

```powershell
npx expo start
```

For testing in a browser:

```powershell
npx expo start --web
```

The mobile application connects to the FastAPI backend running locally.

## Docker Setup

Docker Compose is provided to run the MySQL database, FastAPI backend, and React web application together.

### Start the complete system

From the project root:

```powershell
docker compose up -d --build
```

### Check running services

```powershell
docker compose ps
```

Expected services:

```text
mysql
backend
web
```

### Services and Ports

| Service         | Port | Purpose         |
| --------------- | ---: | --------------- |
| MySQL           | 3307 | Database        |
| FastAPI Backend | 8000 | REST API        |
| React Web       | 5173 | Web application |

### Open the applications

Web application:

```text
http://localhost:5173
```

FastAPI backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

### Stop Docker services

```powershell
docker compose down
```

### Stop services and remove database volume

```powershell
docker compose down -v
```

> Note: `docker compose down -v` removes the MySQL Docker volume and resets the Docker database data.

The mobile application is run separately using Expo.

## Test Credentials

All seeded users use the password:

```text
password123
```

### Employee

```text
Email: sairam@beeja.com
Password: password123
Role: Employee
```

### Manager

```text
Email: manager@beeja.com
Password: password123
Role: Manager
```

### Finance Admin

```text
Email: finance@beeja.com
Password: password123
Role: Finance Admin
```

Additional seeded employees are also available in the database.

## Main API Endpoints

### Authentication

```text
POST /auth/login
GET  /auth/me
```

### Employee Expenses

```text
POST   /expenses
GET    /expenses
GET    /expenses/{id}
PUT    /expenses/{id}
DELETE /expenses/{id}
POST   /expenses/{id}/submit
```

### Manager

```text
GET  /manager/expenses
POST /expenses/{id}/approve
POST /expenses/{id}/reject
```

### Finance

```text
GET  /finance/expenses
POST /expenses/{id}/mark-paid
GET  /finance/summary
```

## End-to-End Workflow

The application supports the following expense lifecycle:

```text
Employee creates Draft
        ↓
Employee submits expense
        ↓
Manager reviews expense
        ↓
   ┌────┴────┐
   ↓         ↓
Approve    Reject
   ↓         ↓
Finance    Employee
Queue      edits expense
   ↓         ↓
Mark Paid  Resubmit
   ↓         ↓
  Paid ←────┘
```

Rejected expenses can be edited and resubmitted by the employee.

## Validation and Error Handling

The application includes:

* Loading states
* Error handling
* Empty states
* Form validation
* API error messages
* Expense status tracking
* Rejected expense editing and resubmission

## Known Limitations / Trade-offs

* Authentication is simulated for the technical assessment and is not a production-grade authentication system.
* Receipt filename/string information is stored; full cloud/object-storage upload is not implemented.
* The application is designed primarily for local/on-premise demonstration.
* Production deployment, HTTPS, and production authentication are outside the scope of this assessment.
* The mobile application is not containerized and is run separately using Expo.

## Testing

The main end-to-end workflow has been tested:

1. Employee creates an expense.
2. Employee submits the expense.
3. Manager views the submitted expense.
4. Manager approves or rejects the expense.
5. Rejected expenses can be edited and resubmitted.
6. Finance Admin marks approved expenses as paid.
7. Employee can see the final `PAID` status.

API endpoints were also tested using the FastAPI Swagger documentation.

The Docker environment was also tested with:

```text
MySQL       → Running
FastAPI     → Running
React Web   → Running
```

## AI Tools Usage

AI tools were used during development as development assistance for:

* Understanding the assessment requirements
* Backend and API troubleshooting
* Debugging database field and relationship issues
* Frontend and mobile UI development assistance
* API testing guidance
* Identifying and fixing integration issues
* Reviewing project structure and documentation

The application was manually tested during development, including the complete employee → manager → finance workflow.

## Future Improvements

Possible future enhancements include:

* JWT-based production authentication
* Real receipt file uploads
* AWS S3/object storage integration
* CSV export
* Mobile camera-based receipt capture
* Role-based authorization middleware
* Automated unit and integration tests
* Production deployment and monitoring

## License

This project was developed as part of a technical assessment for Beeja AI Solutions.
