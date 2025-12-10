<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Wallet Service API

A production-ready backend wallet service built with NestJS, featuring Paystack payment integration, JWT authentication, and API key management for service-to-service communication.

## Features

- 🔐 **Google OAuth Authentication** - Secure user login with JWT tokens
- 💰 **Wallet Operations** - Deposits, transfers, balance checks, transaction history
- 💳 **Paystack Integration** - Seamless payment processing with webhook support
- 🔑 **API Key System** - Service-to-service authentication with granular permissions
- 🛡️ **Security** - Webhook signature validation, bcrypt hashing, permission-based access
- 📊 **Transaction Management** - Complete audit trail with idempotent operations
- 📚 **API Documentation** - Interactive Swagger/OpenAPI docs

## Tech Stack

- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** Passport.js (Google OAuth 2.0, JWT)
- **Payment:** Paystack
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator, class-transformer

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Paystack account (test mode is fine)
- Google OAuth credentials

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd wallet-service
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=wallet_service_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Paystack
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# App
PORT=3000
APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

Create the PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE wallet_service_db;
\q
```

The application will automatically create tables on first run (via TypeORM synchronize).

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 6. Paystack Setup

1. Sign up at [Paystack](https://paystack.com)
2. Get your test API keys from Settings → API Keys & Webhooks
3. Copy keys to `.env`
4. **For webhook testing:**
   - Install ngrok: `npm install -g ngrok`
   - Run: `ngrok http 3000`
   - Copy the HTTPS URL
   - Add webhook URL in Paystack dashboard: `https://your-ngrok-url.ngrok-free.app/wallet/paystack/webhook`

## Running the Application

### Development Mode
```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

### Production Mode
```bash
npm run build
npm run start:prod
```

## API Documentation

Interactive API documentation is available at:

**Swagger UI:** `http://localhost:3000/api/docs`

## API Overview

### Authentication

#### Google OAuth Login
```bash
GET /auth/google
```

Redirects to Google OAuth consent page. Use in a browser.

**Response (after successful login):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "41458da0-4b43-4661-9a57-85ceb53482d6",
    "email": "user@example.com",
    "walletNumber": "4566678954356"
  }
}
```

### Wallet Operations

All wallet endpoints accept **either** JWT (Bearer token) **or** API Key (`x-api-key` header).

#### Get Wallet Balance
```bash
GET /wallet/balance
Authorization: Bearer <jwt_token>
# OR
x-api-key: <api_key>
```

**Response:**
```json
{
  "balance": 15000
}
```

#### Initialize Deposit
```bash
POST /wallet/deposit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 5000
}
```

**Response:**
```json
{
  "reference": "dep_1765327886986_b58962b0",
  "authorization_url": "https://checkout.paystack.com/xyz123"
}
```

**Flow:**
1. User receives payment URL
2. User completes payment on Paystack
3. Paystack sends webhook to your server
4. Wallet is credited automatically

#### Transfer to Another Wallet
```bash
POST /wallet/transfer
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "wallet_number": "4566678954356",
  "amount": 1000
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Transfer completed",
  "transactionId": "41458da0-4b43-4661-9a57-85ceb53482d6"
}
```

#### Get Transaction History
```bash
GET /wallet/transactions
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "41458da0-4b43-4661-9a57-85ceb53482d6",
    "type": "deposit",
    "amount": 5000,
    "status": "success",
    "reference": "dep_1765327886986_b58962b0",
    "createdAt": "2025-12-10T01:05:58.000Z"
  },
  {
    "id": "51458da0-4b43-4661-9a57-85ceb53482d7",
    "type": "transfer",
    "amount": 1000,
    "status": "success",
    "recipientWalletId": "61458da0-4b43-4661-9a57-85ceb53482d8",
    "createdAt": "2025-12-10T02:10:30.000Z"
  }
]
```

#### Check Deposit Status
```bash
GET /wallet/deposit/{reference}/status
```

No authentication required. Used as Paystack callback URL.

### API Key Management

API keys allow service-to-service authentication with granular permissions.

#### Create API Key
```bash
POST /keys/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "wallet-service",
  "permissions": ["deposit", "transfer", "read"],
  "expiry": "1D"
}
```

**Expiry Options:** `1H` (1 hour), `1D` (1 day), `1M` (1 month), `1Y` (1 year)

**Permissions:**
- `read` - View balance and transactions
- `deposit` - Initialize deposits
- `transfer` - Transfer funds

**Response:**
```json
{
  "api_key": "sk_live_abc123xyz...",
  "expires_at": "2025-12-11T01:05:58.000Z"
}
```

⚠️ **Important:** Save the API key securely. It cannot be retrieved again.

#### Rollover Expired API Key
```bash
POST /keys/rollover
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "expired_key_id": "41458da0-4b43-4661-9a57-85ceb53482d6",
  "expiry": "1M"
}
```

Creates a new key with the same permissions as the expired one.

#### Revoke API Key
```bash
DELETE /keys/{keyId}/revoke
Authorization: Bearer <jwt_token>
```

Permanently disables an API key.

### Webhooks

Paystack webhook endpoint (called automatically by Paystack):
```bash
POST /wallet/paystack/webhook
x-paystack-signature: <signature>
```

This endpoint is secured with HMAC signature validation and processes payment notifications.

## Testing

### Manual Testing with cURL

**1. Login and get JWT:**
```bash
# Open in browser
open http://localhost:3000/auth/google
# Copy the access_token from response
```

**2. Check balance:**
```bash
curl -X GET http://localhost:3000/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Create API key:**
```bash
curl -X POST http://localhost:3000/keys/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-key",
    "permissions": ["read", "deposit", "transfer"],
    "expiry": "1D"
  }'
```

**4. Use API key:**
```bash
curl -X GET http://localhost:3000/wallet/balance \
  -H "x-api-key: YOUR_API_KEY"
```

### Testing with Postman

Import the `postman-collection.json` file included in the repository for a complete test suite.

### Testing Paystack Webhooks Locally

1. **Start ngrok:**
```bash
ngrok http 3000
```

2. **Update Paystack webhook URL:**
   - Go to Paystack Dashboard → Settings → Webhooks
   - Set URL to: `https://YOUR_NGROK_URL.ngrok-free.app/wallet/paystack/webhook`

3. **Make a test payment:**
   - Use Paystack test card: `4084084084084081`
   - Expiry: Any future date
   - CVV: Any 3 digits

4. **Verify webhook:**
   - Check your terminal logs for webhook confirmation
   - Check wallet balance - it should be updated

## Project Structure
```
src/
├── api-key/           # API key management
│   ├── dto/
│   ├── entities/
│   ├── api-key.controller.ts
│   └── api-key.service.ts
├── auth/              # Authentication
│   ├── strategies/
│   ├── entities/
│   ├── auth.controller.ts
│   └── auth.service.ts
├── wallet/            # Wallet operations
│   ├── dto/
│   ├── entities/
│   ├── wallet.controller.ts
│   └── wallet.service.ts
├── transaction/       # Transaction management
│   ├── dto/
│   ├── entities/
│   └── transaction.service.ts
├── paystack/          # Payment processing
│   ├── paystack.controller.ts
│   └── paystack.service.ts
├── common/            # Shared resources
│   ├── guards/       # Auth guards
│   └── decorators/   # Custom decorators
└── main.ts           # Application entry point
```

## Security Considerations

- ✅ JWT tokens expire after 7 days (configurable)
- ✅ API keys are hashed with bcrypt (never stored in plain text)
- ✅ Webhook signatures are validated using HMAC-SHA512
- ✅ Maximum 5 active API keys per user
- ✅ Permission-based access control for API keys
- ✅ Idempotent webhook processing (prevents double-crediting)
- ✅ Atomic database transactions for transfers
- ✅ Input validation on all endpoints
