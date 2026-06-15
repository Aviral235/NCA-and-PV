# MongoDB Database Management & Account Administration Guide

This guide provides administration instructions and schema details for the user accounts database.

---

## 1. Database Schema Architecture

The database is built on **MongoDB** using **Mongoose** as the Object Data Modeling (ODM) layer. The primary collection is `users`, represented by the Mongoose schema in `backend/models/User.js`.

### User Schema

| Field Name | Type | Rules | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | The unique identifier of the user document. |
| `fullName` | String | Required | The user's full name. |
| `email` | String | Required, Unique, Lowercase (recommended) | The user's unique login email. |
| `password` | String | Required | The salted and hashed password (never stored in plain text). |

### Indexing Recommendations
For optimal performance, the `email` field is indexed uniquely:
```javascript
email: {
    type: String,
    required: true,
    unique: true
}
```
This ensures `O(1)` lookups during login validation and prevents duplicate signups at the database level.

---

## 2. Security & Authentication Flow

Security protocols protect credentials during transit and storage.

### Password Hashing
- **Algorithm**: `bcrypt` (using `10` salt rounds).
- **Behavior**: Plain-text passwords are encrypted before storage. During login, `bcrypt.compare` verifies the input against the stored hash.

### Session Authentication
- **Token Type**: JSON Web Tokens (JWT).
- **Signature Payload**: `{ id: user._id, email: user.email }`.
- **Validation**: Incoming requests carry the token in the `Authorization: Bearer <token>` header. The `authenticateToken` middleware verifies it using the server-side `JWT_SECRET`.

---

## 3. Database Administration Operations

### 3.1. Backup and Restore Procedures

Run these commands in the terminal of the database server (or locally if MongoDB database tools are installed):

#### Full Backup
To generate a backup dump of the database:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/database_name" --out="./backup/"
```

#### Restore Database
To restore the database from a dump folder:
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/database_name" --dir="./backup/database_name"
```

### 3.2. Local Development Connection
When running MongoDB locally:
1. Install MongoDB Community Server.
2. Set `MONGO_URL=mongodb://localhost:27017/news-credibility` in your `.env` file.
3. Use **MongoDB Compass** to connect and browse tables visually.

---

## 4. API Endpoint Reference

The backend exposes the following endpoints on port `8080`:

### `POST /signup` (or `/signup.html`)
Registers a new user account.
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "_id": "65abef...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOi..."
  }
  ```

### `POST /login` (or `/login.html`)
Authenticates an existing user and returns a token.
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "_id": "65abef...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOi..."
  }
  ```

### `GET /api/auth/me`
Retrieves details of the currently authenticated user session.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "_id": "65abef...",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
  ```

### `POST /api/auth/update`
Updates user profile settings (name, email, or password).
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "fullName": "John Updated",
    "email": "john.new@example.com",
    "currentPassword": "securepassword",
    "newPassword": "newsecurepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "_id": "65abef...",
    "fullName": "John Updated",
    "email": "john.new@example.com",
    "token": "newJwtTokenString...",
    "passwordChanged": true
  }
  ```
