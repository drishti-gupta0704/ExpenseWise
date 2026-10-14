
# ExpenseWise — Expense Tracker API

A RESTful backend API built with Node.js, Express.js, and MongoDB to manage personal finances. ExpenseWise allows users to track income and expenses, organize transactions by category, filter transaction records, and analyze their monthly financial activity.



# **Click to View Live project:** 

[https://expensewise-8njb.onrender.com](https://expensewise-8njb.onrender.com)

---

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT), bcrypt password hashing
- **API Style:** RESTful APIs
- **Deployment:** Render

## Features :

- User Authentication: Secure registration and login using JWT authentication and password hashing with bcrypt.

- Transaction Management: Create, retrieve, update, and delete income and expense transactions.

- User-Specific Data: Users can access and manage only their own transactions.

- Filtering: Filter transactions by type, category, and date range.

- Sorting: Sort transactions by date or amount in ascending or descending order.

- Pagination: Retrieve transactions in manageable pages with configurable limits.

- Monthly Summary: Calculate total income, total expenses, and remaining balance for a selected month.

- Category-wise Analytics: Group expenses by category and calculate total spending.

- Monthly Trends: Analyze income and expenses across the last six months.

- Input Validation: Validate query parameters and handle invalid requests.

- Error Handling: Return appropriate HTTP status codes and error responses.

---


## API Documentation

**Base URL (Live):** https://expensewise-8njb.onrender.com

**Base URL (Local):** `http://localhost:4000`

### 1. Authentication APIs

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Not required |
| POST | `/api/auth/login` | Log in and receive JWT | Not required |

**Register —** `POST /api/auth/register`

Request body:

```json
{
  "name": "Drishti",
  "email": "drishti@example.com",
  "password": "your-password"
}
```

**Login —** `POST /api/auth/login`

Request body:

```json
{
  "email": "drishti@example.com",
  "password": "your-password"
}
```

Protected APIs require a JWT in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Transaction APIs

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/transactions` | Create a transaction | Required |
| GET | `/api/transactions` | Retrieve transactions | Required |
| PUT | `/api/transactions/:id` | Update a transaction | Required |
| DELETE | `/api/transactions/:id` | Delete a transaction | Required |

#### Filtering, Sorting and Pagination

The `GET /api/transactions` endpoint supports query parameters:

| Parameter | Purpose | Example |
|---|---|---|
| `type` | Filter by transaction type | `type=expense` |
| `category` | Filter by category | `category=Food` |
| `startDate` | Filter from a date | `startDate=2026-10-01` |
| `endDate` | Filter through a date | `endDate=2026-10-31` |
| `sortBy` | Sort by date or amount | `sortBy=amount` |
| `order` | Set sort direction | `order=desc` |
| `page` | Specify page number | `page=1` |
| `limit` | Set results per page | `limit=10` |

Example:

```http
GET /api/transactions?type=expense&category=Food&page=1&limit=10
```

### 3. Analytics APIs

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| GET | `/api/analytics/summary?month=YYYY-MM` | Retrieve monthly income, expenses and balance | Required |
| GET | `/api/analytics/categories?month=YYYY-MM` | Retrieve category-wise spending | Required |
| GET | `/api/analytics/monthly-trend` | Retrieve income and expenses over the last six months | Required |

**Monthly summary example:**

```http
GET /api/analytics/summary?month=2026-10
```

Example response:

```json
{
  "month": "2026-10",
  "totalIncome": 45000,
  "totalExpenses": 0,
  "balance": 45000
}
```

**Category-wise spending:**

```http
GET /api/analytics/categories?month=2026-10
```

**Monthly trend:**

```http
GET /api/analytics/monthly-trend
```

### 4. API Summary

| Module | Number of Endpoints |
|---|---:|
| Authentication | 2 |
| Transactions | 4 |
| Analytics | 3 |
| **Total** | **9** |

