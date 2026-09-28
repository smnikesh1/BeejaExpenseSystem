import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- ERROR MESSAGE HELPER ----------------

  const getErrorMessage = (data, defaultMessage) => {
    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((error) => error.msg || "Validation error")
        .join(", ");
    }

    return defaultMessage;
  };

  // ---------------- LOGIN ----------------

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(getErrorMessage(data, "Login failed"));
        return;
      }

      setUser(data.user);

      if (data.user.role === "manager") {
        loadManagerExpenses();
      }

      if (data.user.role === "finance_admin") {
        loadFinanceData();
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- MANAGER ----------------

  const loadManagerExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/manager/expenses`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(getErrorMessage(data, "Unable to load expenses"));
        return;
      }

      setExpenses(data);
    } catch (error) {
      console.error(error);
      setMessage("Cannot load expenses");
    }
  };

  const approveExpense = async (expenseId) => {
    const comment =
      window.prompt("Enter approval comment:") ||
      "Approved from manager dashboard";

    try {
      const response = await fetch(
        `${API_URL}/expenses/${expenseId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            manager_id: user.id,
            comment: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(getErrorMessage(data, "Approval failed"));
        return;
      }

      setMessage("Expense approved successfully");

      await loadManagerExpenses();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const rejectExpense = async (expenseId) => {
    const comment = window.prompt("Enter rejection reason:");

    if (!comment) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/expenses/${expenseId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            manager_id: user.id,
            comment: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(getErrorMessage(data, "Rejection failed"));
        return;
      }

      setMessage("Expense rejected successfully");

      await loadManagerExpenses();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  // ---------------- FINANCE ----------------

  const loadFinanceData = async () => {
    try {
      const expensesResponse = await fetch(
        `${API_URL}/finance/expenses`
      );

      const expensesData = await expensesResponse.json();

      if (!expensesResponse.ok) {
        setMessage(
          getErrorMessage(
            expensesData,
            "Unable to load finance expenses"
          )
        );
        return;
      }

      setExpenses(expensesData);

      const summaryResponse = await fetch(
        `${API_URL}/finance/summary`
      );

      const summaryData = await summaryResponse.json();

      if (!summaryResponse.ok) {
        setMessage(
          getErrorMessage(
            summaryData,
            "Unable to load finance summary"
          )
        );
        return;
      }

      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const markPaid = async (expenseId) => {
    try {
      const response = await fetch(
        `${API_URL}/expenses/${expenseId}/mark-paid`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            data,
            "Unable to mark expense as paid"
          )
        );
        return;
      }

      setMessage("Expense marked as paid successfully");

      await loadFinanceData();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  // ---------------- LOGOUT ----------------

  const logout = () => {
    setUser(null);
    setEmail("");
    setPassword("");
    setExpenses([]);
    setSummary(null);
    setMessage("");
  };

  // ---------------- LOGIN PAGE ----------------

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Beeja Expense Management</h1>

          <h2>Login to your account</h2>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <div className="test-accounts">
            <h3>Test Accounts</h3>

            <p>
              <strong>Manager:</strong>{" "}
              manager@beeja.com
            </p>

            <p>
              <strong>Finance:</strong>{" "}
              finance@beeja.com
            </p>

            <p>
              <strong>Employee:</strong>{" "}
              sairam@beeja.com
            </p>

            <p>
              <strong>Password:</strong>{" "}
              password123
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- MANAGER DASHBOARD ----------------

  if (user.role === "manager") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Manager Dashboard</h1>

            <p>
              Welcome, {user.name}
            </p>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          <h2>Pending Expense Approvals</h2>

          {message && (
            <div className="dashboard-message">
              {message}
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="empty-box">
              <h3>No pending expenses</h3>

              <p>
                There are currently no submitted
                expenses waiting for approval.
              </p>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => (
                <div
                  className="expense-card"
                  key={expense.id}
                >
                  <div className="expense-info">
                    <h3>{expense.title}</h3>

                    <p>
                      <strong>Employee:</strong>{" "}
                      {expense.employee_name}
                    </p>

                    <p>
                      <strong>Employee Code:</strong>{" "}
                      {expense.employee_code}
                    </p>

                    <p>
                      <strong>Department:</strong>{" "}
                      {expense.department || "Not specified"}
                    </p>

                    <p>
                      <strong>Category:</strong>{" "}
                      {expense.category}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {expense.expense_date}
                    </p>

                    {expense.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {expense.description}
                      </p>
                    )}
                  </div>

                  <div className="expense-right">
                    <div className="expense-amount">
                      ₹
                      {Number(expense.amount).toFixed(2)}
                    </div>

                    <div className="expense-status">
                      {expense.status}
                    </div>

                    <div className="expense-actions">
                      <button
                        className="approve-button"
                        onClick={() =>
                          approveExpense(expense.id)
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="reject-button"
                        onClick={() =>
                          rejectExpense(expense.id)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ---------------- FINANCE DASHBOARD ----------------

  if (user.role === "finance_admin") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Finance Admin Dashboard</h1>

            <p>
              Welcome, {user.name}
            </p>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          <h2>Finance Overview</h2>

          {message && (
            <div className="dashboard-message">
              {message}
            </div>
          )}

          {summary && (
            <div className="summary-grid">
              <div className="summary-card">
                <h3>Total Expenses</h3>

                <div className="summary-number">
                  {summary.total_expenses}
                </div>
              </div>

              <div className="summary-card">
                <h3>Total Amount</h3>

                <div className="summary-number">
                  ₹
                  {Number(
                    summary.total_amount || 0
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <h2 className="section-title">
            Approved Expenses
          </h2>

          {expenses.length === 0 ? (
            <div className="empty-box">
              <h3>No approved expenses</h3>

              <p>
                There are currently no approved
                expenses waiting for payment.
              </p>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => (
                <div
                  className="expense-card"
                  key={expense.id}
                >
                  <div className="expense-info">
                    <h3>{expense.title}</h3>

                    <p>
                      <strong>Employee:</strong>{" "}
                      {expense.employee_name}
                    </p>

                    <p>
                      <strong>Employee Code:</strong>{" "}
                      {expense.employee_code}
                    </p>

                    <p>
                      <strong>Department:</strong>{" "}
                      {expense.department || "Not specified"}
                    </p>

                    <p>
                      <strong>Category:</strong>{" "}
                      {expense.category}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {expense.expense_date}
                    </p>

                    {expense.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {expense.description}
                      </p>
                    )}
                  </div>

                  <div className="expense-right">
                    <div className="expense-amount">
                      ₹
                      {Number(expense.amount).toFixed(2)}
                    </div>

                    <div className="expense-status">
                      {expense.status}
                    </div>

                    <div className="expense-actions">
                      <button
                        className="approve-button"
                        onClick={() =>
                          markPaid(expense.id)
                        }
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ---------------- EMPLOYEE TEMPORARY PAGE ----------------

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Employee Dashboard</h1>

          <p>
            Welcome, {user.name}
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <h2>Employee Mobile App</h2>

        <p>
          The employee mobile application
          will be added next.
        </p>
      </main>
    </div>
  );
}

export default App;