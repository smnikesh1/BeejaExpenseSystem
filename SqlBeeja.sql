CREATE DATABASE beeja_expense_db;
USE beeja_expense_db;


CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('employee', 'manager', 'finance_admin') NOT NULL,
    department VARCHAR(100),
    manager_id INT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url VARCHAR(500),
    status ENUM('draft', 'submitted', 'approved', 'rejected', 'paid')
        DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    manager_id INT NOT NULL,
    action ENUM('approved', 'rejected') NOT NULL,
    comment TEXT,
    acted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);



USE beeja_expense_db;

INSERT INTO employees
(employee_code, name, email, role, department, manager_id, password_hash)
VALUES
('MGR001', 'Arun Manager', 'manager@beeja.com', 'manager', 'IT', NULL,
'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),

('FIN001', 'Priya Finance', 'finance@beeja.com', 'finance_admin', 'Finance', NULL,
'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');

INSERT INTO employees
(employee_code, name, email, role, department, manager_id, password_hash)
VALUES
('EMP001', 'Sairam Employee', 'sairam@beeja.com', 'employee', 'IT', 1,
'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),

('EMP002', 'Rahul Kumar', 'rahul@beeja.com', 'employee', 'Sales', 1,
'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),

('EMP003', 'Anitha Devi', 'anitha@beeja.com', 'employee', 'HR', 1,
'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');


SELECT id, employee_code, name, email, role, department, manager_id
FROM employees;


USE beeja_expense_db;

INSERT INTO expenses
(employee_id, title, amount, category, expense_date, description, status, submitted_at)
VALUES
(3, 'Office Travel', 850.00, 'Travel', '2026-09-10',
 'Travel to client office', 'submitted', NOW()),

(3, 'Team Lunch', 1200.00, 'Food', '2026-09-11',
 'Lunch with project team', 'approved', NOW()),

(3, 'Internet Bill', 799.00, 'Utilities', '2026-09-12',
 'Monthly internet expense', 'paid', NOW()),

(4, 'Client Meeting Travel', 650.00, 'Travel', '2026-09-13',
 'Auto and bus travel for client meeting', 'submitted', NOW()),

(4, 'Hotel Stay', 2500.00, 'Accommodation', '2026-09-14',
 'One night stay for business trip', 'approved', NOW()),

(4, 'Stationery', 450.00, 'Office Supplies', '2026-09-15',
 'Notebooks and office stationery', 'rejected', NOW()),

(5, 'Cab Expense', 900.00, 'Travel', '2026-09-16',
 'Cab for official meeting', 'draft', NULL),

(5, 'Conference Fee', 3000.00, 'Training', '2026-09-17',
 'Technical conference registration', 'submitted', NOW()),

(5, 'Mobile Bill', 599.00, 'Utilities', '2026-09-18',
 'Official mobile bill', 'approved', NOW()),

(3, 'Laptop Accessories', 1800.00, 'Office Supplies', '2026-09-19',
 'Keyboard and mouse', 'draft', NULL);
 
 
 
 SELECT id, employee_id, title, amount, category, status
FROM expenses
ORDER BY id;


USE beeja_expense_db;

INSERT INTO approvals
(expense_id, manager_id, action, comment)
VALUES
(2, 1, 'approved', 'Expense is valid and approved.'),
(5, 1, 'approved', 'Business travel expense approved.'),
(6, 1, 'rejected', 'Please provide a valid receipt.');


SELECT * FROM approvals;

USE beeja_expense_db;

DESCRIBE employees;

USE beeja_expense_db;

DESCRIBE expenses;

DESCRIBE approvals;

SELECT * FROM expenses WHERE id = 11;

SELECT id, title, status
FROM expenses
ORDER BY id DESC;

SELECT id, title, status
FROM expenses
ORDER BY id;

USE beeja_expense_db;


DESCRIBE employees;

SELECT id, title, status
FROM expenses
ORDER BY id DESC;

SELECT id, employee_code, name, role
FROM employees
WHERE role = 'manager';