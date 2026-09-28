import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// BACKEND URL
// ============================================================

const API_URL = "http://localhost:8000";

// ============================================================
// TYPES
// ============================================================

type User = {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  role: string;
};

type Expense = {
  id: number;
  employee_id: number;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  description?: string;
  receipt_url?: string;
  status: string;
  submitted_at?: string;
  created_at?: string;
};

type Screen = "dashboard" | "newExpense";

// ============================================================
// MAIN APP
// ============================================================

export default function Index() {
  // ==========================================================
  // LOGIN STATE
  // ==========================================================

  const [email, setEmail] = useState("sairam@beeja.com");
  const [password, setPassword] = useState("password123");

  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // SCREEN STATE
  // ==========================================================

  const [screen, setScreen] = useState<Screen>("dashboard");

  // null = creating a new expense
  // number = editing an existing expense
  const [editingExpenseId, setEditingExpenseId] =
    useState<number | null>(null);

  // ==========================================================
  // EXPENSE FORM
  // ==========================================================

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Travel");

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [description, setDescription] = useState("");

  const [savingExpense, setSavingExpense] = useState(false);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      console.log(
        "Trying to connect to:",
        API_URL + "/auth/login"
      );

      const response = await fetch(
        API_URL + "/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      console.log(
        "Login response status:",
        response.status
      );

      const data = await response.json();

      console.log(
        "Login response:",
        data
      );

      if (!response.ok) {
        setError(
          data.detail || "Login failed"
        );
        return;
      }

      if (!data.user) {
        setError(
          "Login successful, but user information was not returned."
        );
        return;
      }

      // Employee mobile app only
      if (data.user.role !== "employee") {
        setError(
          "This mobile app is for Employee login only."
        );
        return;
      }

      setUser(data.user);
      setScreen("dashboard");

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Cannot connect to backend. Make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD EMPLOYEE EXPENSES
  // ==========================================================

  const loadExpenses = async () => {
    if (!user) {
      return;
    }

    setLoadingExpenses(true);

    try {
      console.log(
        "Loading expenses for employee:",
        user.id
      );

      const response = await fetch(
        API_URL +
          "/expenses?employee_id=" +
          user.id
      );

      console.log(
        "Expenses response status:",
        response.status
      );

      const data = await response.json();

      console.log(
        "Expenses response:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Error",
          data.detail || "Unable to load expenses."
        );
        return;
      }

      setExpenses(data);

    } catch (error) {
      console.error(
        "Load expenses error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Cannot connect to FastAPI."
      );

    } finally {
      setLoadingExpenses(false);
    }
  };

  // ==========================================================
  // LOAD EXPENSES AFTER LOGIN
  // ==========================================================

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  // ==========================================================
  // RESET EXPENSE FORM
  // ==========================================================

  const resetExpenseForm = () => {
    setTitle("");
    setAmount("");
    setCategory("Travel");

    setExpenseDate(
      new Date().toISOString().split("T")[0]
    );

    setDescription("");
  };

  // ==========================================================
  // START EDITING REJECTED EXPENSE
  // ==========================================================

  const startEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);

    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setExpenseDate(expense.expense_date);
    setDescription(expense.description || "");

    setScreen("newExpense");
  };

  // ==========================================================
  // CREATE EXPENSE
  // ==========================================================

  const createExpense = async (
    submitAfterCreate: boolean
  ) => {
    if (!user) {
      return;
    }

    // Validate title
    if (!title.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter an expense title."
      );
      return;
    }

    // Validate amount
    const numericAmount = Number(amount);

    if (
      !amount.trim() ||
      isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid expense amount."
      );
      return;
    }

    // Validate date
    if (!expenseDate.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter the expense date."
      );
      return;
    }

    setSavingExpense(true);

    try {
      console.log(
        "Creating expense..."
      );

      const response = await fetch(
        API_URL + "/expenses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: user.id,
            title: title.trim(),
            amount: numericAmount,
            category: category,
            expense_date: expenseDate,
            description:
              description.trim() || null,
            receipt_url: null,
          }),
        }
      );

      console.log(
        "Create expense response:",
        response.status
      );

      const data = await response.json();

      console.log(
        "Create expense data:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Error",
          data.detail ||
            "Unable to create expense."
        );
        return;
      }

      const newExpenseId =
        data.expense_id;

      // --------------------------------------------------------
      // SAVE AS DRAFT
      // --------------------------------------------------------

      if (!submitAfterCreate) {
        Alert.alert(
          "Success",
          "Expense saved as draft."
        );

        resetExpenseForm();

        await loadExpenses();

        setScreen("dashboard");

        return;
      }

      // --------------------------------------------------------
      // SUBMIT EXPENSE
      // --------------------------------------------------------

      const submitResponse =
        await fetch(
          API_URL +
            "/expenses/" +
            newExpenseId +
            "/submit",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

      const submitData =
        await submitResponse.json();

      console.log(
        "Submit expense response:",
        submitResponse.status
      );

      console.log(
        "Submit expense data:",
        submitData
      );

      if (!submitResponse.ok) {
        Alert.alert(
          "Expense Created",
          "Expense was saved as draft, but submission failed."
        );

        resetExpenseForm();

        await loadExpenses();

        setScreen("dashboard");

        return;
      }

      Alert.alert(
        "Success",
        "Expense submitted successfully."
      );

      resetExpenseForm();

      await loadExpenses();

      setScreen("dashboard");

    } catch (error) {
      console.error(
        "Create expense error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Cannot connect to FastAPI."
      );

    } finally {
      setSavingExpense(false);
    }
  };

  // ==========================================================
  // UPDATE EXPENSE
  // ==========================================================

  const updateExpense = async (
    submitAfterUpdate: boolean
  ) => {
    if (
      !user ||
      editingExpenseId === null
    ) {
      return;
    }

    const numericAmount = Number(amount);

    // Validate title
    if (!title.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter an expense title."
      );
      return;
    }

    // Validate amount
    if (
      !amount.trim() ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount."
      );
      return;
    }

    // Validate date
    if (!expenseDate.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter the expense date."
      );
      return;
    }

    setSavingExpense(true);

    try {
      console.log(
        "Updating expense:",
        editingExpenseId
      );

      const response = await fetch(
        `${API_URL}/expenses/${editingExpenseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: user.id,
            title: title.trim(),
            amount: numericAmount,
            category: category,
            expense_date: expenseDate,
            description:
              description.trim() || null,
            receipt_url: null,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Update response:",
        response.status,
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Update Failed",
          data.detail ||
            "Could not update expense."
        );
        return;
      }

      // --------------------------------------------------------
      // RESUBMIT AFTER UPDATE
      // --------------------------------------------------------

      if (submitAfterUpdate) {
        const submitResponse =
          await fetch(
            `${API_URL}/expenses/${editingExpenseId}/submit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

        const submitData =
          await submitResponse.json();

        console.log(
          "Resubmit response:",
          submitResponse.status,
          submitData
        );

        if (!submitResponse.ok) {
          Alert.alert(
            "Submit Failed",
            submitData.detail ||
              "Expense was updated but could not be resubmitted."
          );
          return;
        }
      }

      // --------------------------------------------------------
      // FINISH
      // --------------------------------------------------------

      resetExpenseForm();

      setEditingExpenseId(null);

      await loadExpenses();

      setScreen("dashboard");

      Alert.alert(
        "Success",
        submitAfterUpdate
          ? "Expense updated and resubmitted successfully."
          : "Expense updated successfully."
      );

    } catch (error) {
      console.error(
        "Update expense error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Cannot connect to FastAPI."
      );

    } finally {
      setSavingExpense(false);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    setUser(null);
    setExpenses([]);

    setEmail("sairam@beeja.com");
    setPassword("password123");

    setError("");

    setEditingExpenseId(null);

    setScreen("dashboard");

    resetExpenseForm();
  };

  // ==========================================================
  // STATUS STYLE
  // ==========================================================

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "paid":
        return styles.statusPaid;

      case "approved":
        return styles.statusApproved;

      case "rejected":
        return styles.statusRejected;

      case "submitted":
        return styles.statusSubmitted;

      default:
        return styles.statusDraft;
    }
  };

  // ==========================================================
  // LOGIN SCREEN
  // ==========================================================

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>

        <ScrollView
          contentContainerStyle={
            styles.loginContainer
          }
        >

          <View style={styles.loginCard}>

            <Text style={styles.logo}>
              Beeja
            </Text>

            <Text style={styles.title}>
              Expense Management
            </Text>

            <Text style={styles.subtitle}>
              Employee Mobile App
            </Text>

            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >

              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Login
                </Text>
              )}

            </TouchableOpacity>

            <View style={styles.testAccount}>

              <Text style={styles.testTitle}>
                Test Employee Account
              </Text>

              <Text style={styles.testText}>
                Email: sairam@beeja.com
              </Text>

              <Text style={styles.testText}>
                Password: password123
              </Text>

            </View>

          </View>

        </ScrollView>

      </SafeAreaView>
    );
  }

  // ==========================================================
  // NEW / EDIT EXPENSE SCREEN
  // ==========================================================

  if (screen === "newExpense") {
    const isEditing =
      editingExpenseId !== null;

    return (
      <SafeAreaView style={styles.container}>

        <ScrollView
          contentContainerStyle={
            styles.dashboardContainer
          }
        >

          {/* HEADER */}

          <View style={styles.header}>

            <View>
              <Text style={styles.welcome}>
                {isEditing
                  ? "Edit Expense"
                  : "New Expense"}
              </Text>

              <Text
                style={styles.employeeName}
              >
                {isEditing
                  ? "Update Rejected Expense"
                  : "Create Expense Claim"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                resetExpenseForm();
                setEditingExpenseId(null);
                setScreen("dashboard");
              }}
            >
              <Text style={styles.logoutText}>
                Back
              </Text>
            </TouchableOpacity>

          </View>

          {/* FORM */}

          <View style={styles.formCard}>

            {/* TITLE */}

            <Text style={styles.formLabel}>
              Expense Title
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Client Travel"
              value={title}
              onChangeText={setTitle}
            />

            {/* AMOUNT */}

            <Text style={styles.formLabel}>
              Amount
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: 500"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* CATEGORY */}

            <Text style={styles.formLabel}>
              Category
            </Text>

            <View style={styles.categoryRow}>

              {[
                "Travel",
                "Food",
                "Utilities",
                "Office Supplies",
                "Other",
              ].map((item) => (

                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryButton,
                    category === item &&
                      styles.categoryButtonSelected,
                  ]}
                  onPress={() =>
                    setCategory(item)
                  }
                >

                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === item &&
                        styles.categoryButtonTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>

              ))}

            </View>

            {/* DATE */}

            <Text style={styles.formLabel}>
              Expense Date
            </Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={expenseDate}
              onChangeText={setExpenseDate}
            />

            <Text style={styles.dateHint}>
              Format: YYYY-MM-DD
            </Text>

            {/* DESCRIPTION */}

            <Text style={styles.formLabel}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              placeholder="Enter expense details"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* =================================================
                CREATE MODE
            ================================================= */}

            {!isEditing && (
              <>
                <TouchableOpacity
                  style={styles.draftButton}
                  onPress={() =>
                    createExpense(false)
                  }
                  disabled={savingExpense}
                >

                  {savingExpense ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Save as Draft
                    </Text>
                  )}

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() =>
                    createExpense(true)
                  }
                  disabled={savingExpense}
                >

                  {savingExpense ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Submit Expense
                    </Text>
                  )}

                </TouchableOpacity>
              </>
            )}

            {/* =================================================
                EDIT MODE
            ================================================= */}

            {isEditing && (
              <>
                <TouchableOpacity
                  style={styles.draftButton}
                  onPress={() =>
                    updateExpense(false)
                  }
                  disabled={savingExpense}
                >

                  {savingExpense ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Update Expense
                    </Text>
                  )}

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() =>
                    updateExpense(true)
                  }
                  disabled={savingExpense}
                >

                  {savingExpense ? (
                    <ActivityIndicator
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Update & Resubmit
                    </Text>
                  )}

                </TouchableOpacity>
              </>
            )}

          </View>

        </ScrollView>

      </SafeAreaView>
    );
  }

  // ==========================================================
  // EMPLOYEE DASHBOARD
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={
          styles.dashboardContainer
        }
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View>

            <Text style={styles.welcome}>
              Welcome,
            </Text>

            <Text
              style={styles.employeeName}
            >
              {user.name}
            </Text>

          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >

            <Text style={styles.logoutText}>
              Logout
            </Text>

          </TouchableOpacity>

        </View>

        {/* EMPLOYEE INFO */}

        <View style={styles.infoCard}>

          <Text style={styles.infoTitle}>
            Employee Information
          </Text>

          <Text style={styles.infoText}>
            Employee ID: {user.employee_code}
          </Text>

          <Text style={styles.infoText}>
            Email: {user.email}
          </Text>

          <Text style={styles.infoText}>
            Role: {user.role}
          </Text>

        </View>

        {/* NEW EXPENSE BUTTON */}

        <TouchableOpacity
          style={styles.newExpenseButton}
          onPress={() => {
            setEditingExpenseId(null);
            resetExpenseForm();
            setScreen("newExpense");
          }}
        >

          <Text
            style={
              styles.newExpenseButtonText
            }
          >
            + New Expense
          </Text>

        </TouchableOpacity>

        {/* EXPENSE SECTION */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            My Expense Claims
          </Text>

          <TouchableOpacity
            onPress={loadExpenses}
            style={styles.refreshButton}
          >

            <Text style={styles.refreshText}>
              Refresh
            </Text>

          </TouchableOpacity>

        </View>

        {/* LOADING */}

        {loadingExpenses && (
          <ActivityIndicator
            size="large"
            style={styles.loader}
          />
        )}

        {/* NO EXPENSES */}

        {!loadingExpenses &&
          expenses.length === 0 && (
            <View style={styles.emptyCard}>

              <Text
                style={styles.emptyTitle}
              >
                No expenses found
              </Text>

              <Text
                style={styles.emptyText}
              >
                You don't have any expense claims yet.
              </Text>

            </View>
          )}

        {/* EXPENSE LIST */}

        {!loadingExpenses &&
          expenses.map((expense) => (

            <View
              key={expense.id}
              style={styles.expenseCard}
            >

              <View
                style={styles.expenseTopRow}
              >

                <Text
                  style={styles.expenseTitle}
                >
                  {expense.title}
                </Text>

                <Text
                  style={styles.expenseAmount}
                >
                  ₹
                  {Number(
                    expense.amount
                  ).toFixed(2)}
                </Text>

              </View>

              <Text
                style={styles.expenseCategory}
              >
                Category: {expense.category}
              </Text>

              <Text
                style={styles.expenseDate}
              >
                Date: {expense.expense_date}
              </Text>

              {expense.description && (
                <Text
                  style={
                    styles.expenseDescription
                  }
                >
                  {expense.description}
                </Text>
              )}

              <View
                style={styles.statusContainer}
              >

                <Text
                  style={styles.statusLabel}
                >
                  Status:
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(
                      expense.status
                    ),
                  ]}
                >

                  <Text
                    style={styles.statusText}
                  >
                    {expense.status.toUpperCase()}
                  </Text>

                </View>

              </View>

              {/* EDIT REJECTED EXPENSE */}

              {expense.status ===
                "rejected" && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    startEditExpense(
                      expense
                    )
                  }
                >

                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit & Resubmit
                  </Text>

                </TouchableOpacity>
              )}

            </View>

          ))}

      </ScrollView>

    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  // ==========================================================
  // LOGIN
  // ==========================================================

  loginContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  loginCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",

    ...(Platform.OS === "web"
      ? {
          boxShadow:
            "0px 4px 12px rgba(0,0,0,0.10)",
        }
      : {}),
  },

  logo: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },

  loginButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 22,
    alignItems: "center",
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 14,
  },

  testAccount: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },

  testTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  testText: {
    fontSize: 13,
    marginTop: 3,
  },

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  dashboardContainer: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  welcome: {
    fontSize: 15,
  },

  employeeName: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 3,
  },

  logoutButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },

  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    marginTop: 5,
  },

  // ==========================================================
  // NEW EXPENSE BUTTON
  // ==========================================================

  newExpenseButton: {
    backgroundColor: "#111827",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },

  newExpenseButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  // ==========================================================
  // EXPENSE SECTION
  // ==========================================================

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  refreshButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  refreshText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  loader: {
    marginTop: 20,
    marginBottom: 20,
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
  },

  expenseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },

  expenseTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  expenseTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },

  expenseAmount: {
    fontSize: 17,
    fontWeight: "800",
  },

  expenseCategory: {
    fontSize: 14,
    marginTop: 10,
  },

  expenseDate: {
    fontSize: 13,
    marginTop: 5,
  },

  expenseDescription: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  statusPaid: {
    backgroundColor: "#dcfce7",
  },

  statusApproved: {
    backgroundColor: "#dbeafe",
  },

  statusRejected: {
    backgroundColor: "#fee2e2",
  },

  statusSubmitted: {
    backgroundColor: "#fef3c7",
  },

  statusDraft: {
    backgroundColor: "#e5e7eb",
  },

  // ==========================================================
  // EDIT BUTTON
  // ==========================================================

  editButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },

  editButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // ==========================================================
  // FORM
  // ==========================================================

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  formLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 15,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 5,
  },

  categoryButtonSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  categoryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  categoryButtonTextSelected: {
    color: "#ffffff",
  },

  dateHint: {
    fontSize: 12,
    marginTop: 5,
  },

  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  draftButton: {
    backgroundColor: "#6b7280",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },

  submitButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

});