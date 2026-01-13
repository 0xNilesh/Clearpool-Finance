# API Documentation

## MongoDB Setup

1. Create a `.env.local` file in the `frontend` directory
2. Add your MongoDB URI:
   ```
   MONGODB_URI=mongodb://localhost:27017/clearpool_finance
   ```
   Or for MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clearpool_finance
   ```

## Database Schema

### Collection: `user_vault_positions`

```typescript
{
  _id: ObjectId,
  userAddress: string,        // Lowercase wallet address
  vaultAddress: string,       // Lowercase vault address
  orders: Array<{
    orderId: ObjectId,
    type: 'deposit' | 'redeem',
    amount: number,           // USDC amount (for deposit) or received amount (for redeem)
    shares: number,           // Shares deposited or redeemed
    transactionHash: string,
    blockNumber: string | null,
    timestamp: Date
  }>,
  totalShares: number,        // Total shares owned
  totalInvestedValue: number, // Total USDC invested (sum of deposits)
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### POST `/api/deposit`

Logs a deposit transaction in the database.

**Request Body:**
```json
{
  "userAddress": "0x...",
  "vaultAddress": "0x...",
  "amount": "100.0",
  "shares": "95.5",
  "transactionHash": "0x...",
  "blockNumber": "12345",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit logged successfully",
  "position": {
    "totalShares": 95.5,
    "totalInvestedValue": 100.0,
    "orderCount": 1
  }
}
```

### POST `/api/redeem`

Logs a redeem transaction in the database.

**Request Body:**
```json
{
  "userAddress": "0x...",
  "vaultAddress": "0x...",
  "shares": "50.0",
  "amount": "105.0",
  "transactionHash": "0x...",
  "blockNumber": "12346",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Redeem logged successfully",
  "position": {
    "totalShares": 45.5,
    "totalInvestedValue": 100.0,
    "orderCount": 2
  }
}
```

### GET `/api/positions?userAddress=0x...`

Gets all vault positions for a user.

**Response:**
```json
{
  "success": true,
  "positions": [
    {
      "userAddress": "0x...",
      "vaultAddress": "0x...",
      "orders": [...],
      "totalShares": 95.5,
      "totalInvestedValue": 100.0,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalVaults": 1
}
```

### GET `/api/positions/[vaultAddress]?userAddress=0x...`

Gets a specific vault position for a user.

**Response:**
```json
{
  "success": true,
  "position": {
    "userAddress": "0x...",
    "vaultAddress": "0x...",
    "orders": [...],
    "totalShares": 95.5,
    "totalInvestedValue": 100.0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Integration

The deposit API is automatically called after a successful deposit transaction in `frontend/app/app/fund/[address]/page.tsx`.

When redeem is implemented, call the redeem API similarly after a successful redeem transaction.
