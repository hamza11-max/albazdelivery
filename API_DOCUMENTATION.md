# AL-baz Delivery API Documentation

## Overview

This document provides comprehensive documentation for the AL-baz Delivery API endpoints. All endpoints require authentication unless otherwise specified.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using NextAuth.js. Include the session cookie in requests or use the `Authorization` header.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

All endpoints are rate-limited:
- **Auth endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute
- **Strict endpoints**: 10 requests per minute

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "0555123456",
  "role": "CUSTOMER"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "message": "Registration successful"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK

### Orders

#### GET /api/orders
Get orders for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": { ... }
  }
}
```

#### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "storeId": "store_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 1500
    }
  ],
  "subtotal": 3000,
  "deliveryFee": 200,
  "total": 3200,
  "paymentMethod": "CASH",
  "deliveryAddress": "123 Main Street",
  "city": "Algiers",
  "customerPhone": "0555123456"
}
```

**Response:** 201 Created

#### GET /api/orders/[id]
Get order details by ID.

**Response:** 200 OK

#### PATCH /api/orders/[id]/status
Update order status (vendor/admin only).

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

### Products

#### GET /api/products
Get products.

**Query Parameters:**
- `storeId` (optional): Filter by store
- `available` (optional): Filter by availability

**Response:** 200 OK

#### POST /api/products
Create a new product (vendor only).

**Request Body:**
```json
{
  "storeId": "store_id",
  "name": "Product Name",
  "description": "Product description",
  "price": 1500,
  "image": "https://example.com/image.jpg",
  "category": "Food"
}
```

**Response:** 201 Created

#### PATCH /api/products
Update product availability (vendor only).

**Request Body:**
```json
{
  "productId": "product_id",
  "available": true
}
```

### Payments

#### POST /api/payments/create
Create a payment for an order.

**Request Body:**
```json
{
  "orderId": "order_id",
  "amount": 3200,
  "method": "WALLET",
  "transactionId": "tx_123" // optional
}
```

**Response:** 201 Created

#### GET /api/payments/history
Get payment history for the authenticated user.

**Response:** 200 OK

### Wallet

#### GET /api/wallet/balance
Get wallet balance.

**Query Parameters:**
- `customerId` (required for admins): Customer ID

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "currency": "DZD"
  }
}
```

#### POST /api/wallet/balance
Add funds to wallet or make a withdrawal.

**Request Body:**
```json
{
  "amount": 1000,
  "description": "Wallet top-up",
  "type": "CREDIT" // or "DEBIT"
}
```

**Response:** 200 OK

#### GET /api/wallet/transactions
Get wallet transaction history.

**Response:** 200 OK

### Loyalty

#### GET /api/loyalty/account
Get loyalty account details.

**Query Parameters:**
- `customerId` (required for admins): Customer ID

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "points": 500,
    "tier": "BRONZE",
    "totalPointsEarned": 1000,
    "totalPointsRedeemed": 500
  }
}
```

#### POST /api/loyalty/account
Update loyalty points (admin only).

**Request Body:**
```json
{
  "customerId": "customer_id",
  "points": 100,
  "description": "Bonus points",
  "orderId": "order_id" // optional
}
```

#### GET /api/loyalty/rewards
Get available loyalty rewards.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "reward_id",
        "name": "Free Delivery",
        "description": "Free delivery on your next order",
        "pointsCost": 100,
        "type": "DISCOUNT",
        "value": 0
      }
    ]
  }
}
```

#### POST /api/loyalty/rewards
Redeem a loyalty reward.

**Request Body:**
```json
{
  "rewardId": "reward_id"
}
```

**Response:** 200 OK

### Reviews

#### POST /api/ratings/reviews
Create a review for an order.

**Request Body:**
```json
{
  "vendorId": "vendor_id",
  "orderId": "order_id",
  "rating": 5,
  "foodQuality": 5,
  "deliveryTime": 4,
  "customerService": 5,
  "comment": "Great food and fast delivery!",
  "photos": ["https://example.com/photo.jpg"]
}
```

**Response:** 201 Created

#### GET /api/ratings/reviews
Get reviews.

**Query Parameters:**
- `vendorId` (optional): Filter by vendor
- `productId` (optional): Filter by product

**Response:** 200 OK

### Support

#### POST /api/support/tickets
Create a support ticket.

**Request Body:**
```json
{
  "subject": "Order Issue",
  "description": "I have an issue with my order",
  "category": "ORDER",
  "priority": "MEDIUM"
}
```

**Response:** 201 Created

#### GET /api/support/tickets
Get support tickets.

**Query Parameters:**
- `status` (optional): Filter by status

**Response:** 200 OK

### Chat

#### GET /api/chat/conversations
Get user's conversations.

**Response:** 200 OK

#### POST /api/chat/conversations
Create a new conversation.

**Request Body:**
```json
{
  "participantIds": ["user_id_1", "user_id_2"],
  "type": "CUSTOMER_VENDOR",
  "relatedOrderId": "order_id" // optional
}
```

**Response:** 201 Created

#### POST /api/chat/send
Send a message in a conversation.

**Request Body:**
```json
{
  "conversationId": "conversation_id",
  "message": "Hello!",
  "attachments": [] // optional
}
```

**Response:** 201 Created

### Delivery

#### GET /api/delivery/zones
Get delivery zones.

**Query Parameters:**
- `city` (optional): Filter by city
- `isActive` (optional): Filter by active status

**Response:** 200 OK

#### POST /api/delivery/zones
Create a delivery zone (admin only).

**Request Body:**
```json
{
  "name": "Centre-ville",
  "city": "Algiers",
  "coordinates": [
    { "lat": 36.7538, "lng": 3.0588 },
    { "lat": 36.7548, "lng": 3.0598 },
    { "lat": 36.7558, "lng": 3.0608 }
  ],
  "deliveryFee": 200,
  "estimatedTime": 25
}
```

**Response:** 201 Created

#### POST /api/delivery/optimize-route
Optimize delivery route for a single driver (admin/driver only).

**Request Body:**
```json
{
  "driverId": "driver_id",
  "orderIds": ["order_id_1", "order_id_2"]
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "route": {
      "driverId": "driver_id",
      "orderIds": ["order_id_1", "order_id_2"],
      "optimizedSequence": ["order_id_1", "order_id_2"],
      "totalDistance": 5.0,
      "estimatedTime": 14,
      "ordersCount": 2
    }
  }
}
```

#### POST /api/delivery/batch-optimize
Batch optimize routes for multiple drivers (admin/driver only).

**Request Body:**
```json
{
  "orders": [
    { "orderId": "order_id_1", "driverId": "driver_id_1" },
    { "orderId": "order_id_2" }
  ],
  "optimizationStrategy": "BALANCED"
}
```

**Query Parameters:**
- `optimizationStrategy` (optional): `DISTANCE`, `TIME`, or `BALANCED` (default: `BALANCED`)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "driverId": "driver_id_1",
        "driverName": "Driver Name",
        "orderIds": ["order_id_1"],
        "optimizedSequence": ["order_id_1"],
        "totalDistance": 2.5,
        "estimatedTime": 7,
        "ordersCount": 1,
        "currentWorkload": 0
      }
    ],
    "totalOrders": 2,
    "totalDrivers": 1,
    "optimizationStrategy": "BALANCED"
  }
}
```

#### POST /api/delivery/assign-nearest-driver
Assign the nearest available driver to an order (admin/vendor only).

**Request Body:**
```json
{
  "orderId": "order_id",
  "driverId": "driver_id" // optional: auto-assign if not provided
}
```

**Response:** 200 OK

### Refunds

#### POST /api/refunds/create
Create a refund request.

**Request Body:**
```json
{
  "orderId": "order_id",
  "reason": "Order was incorrect",
  "amount": 1500 // optional, defaults to full order amount
}
```

**Response:** 201 Created

#### GET /api/refunds/create
Get refund requests.

**Query Parameters:**
- `status` (optional): Filter by status (admin only)
- `orderId` (optional): Filter by order (admin only)

**Response:** 200 OK

### ERP (Vendor Only)

#### GET /api/erp/suppliers
Get suppliers for the vendor.

**Response:** 200 OK

#### POST /api/erp/suppliers
Create a new supplier.

**Request Body:**
```json
{
  "name": "Supplier Name",
  "contactPerson": "John Doe",
  "phone": "0555123456",
  "email": "supplier@example.com",
  "address": "123 Supplier Street"
}
```

**Response:** 201 Created

#### PUT /api/erp/suppliers
Update a supplier.

**Request Body:**
```json
{
  "id": "supplier_id",
  "name": "Updated Name",
  "phone": "0555987654"
}
```

**Response:** 200 OK

#### GET /api/erp/inventory
Get inventory products for the vendor.

**Query Parameters:**
- `lowStock` (optional): `true` to filter low stock products
- `category` (optional): Filter by category

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "sku": "SKU001",
        "name": "Product Name",
        "category": "Food",
        "costPrice": 100,
        "sellingPrice": 150,
        "stock": 50,
        "lowStockThreshold": 10,
        "supplier": {
          "id": "supplier_id",
          "name": "Supplier Name"
        }
      }
    ]
  }
}
```

#### POST /api/erp/inventory
Create a new inventory product.

**Request Body:**
```json
{
  "sku": "SKU001",
  "name": "Product Name",
  "category": "Food",
  "costPrice": 100,
  "sellingPrice": 150,
  "stock": 50,
  "lowStockThreshold": 10,
  "barcode": "1234567890",
  "image": "https://example.com/image.jpg",
  "supplierId": "supplier_id"
}
```

**Response:** 201 Created

#### PUT /api/erp/inventory
Update an inventory product.

**Request Body:**
```json
{
  "id": "product_id",
  "name": "Updated Name",
  "stock": 75,
  "sellingPrice": 160
}
```

**Response:** 200 OK

#### DELETE /api/erp/inventory
Delete an inventory product.

**Query Parameters:**
- `id` (required): Product ID

**Response:** 200 OK

#### GET /api/erp/sales
Get sales for the vendor.

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO format)
- `endDate` (optional): End date filter (ISO format)
- `customerId` (optional): Filter by customer
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100, max: 100)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "sales": [
      {
        "id": "sale_id",
        "customerId": "customer_id",
        "subtotal": 1000,
        "discount": 100,
        "total": 900,
        "paymentMethod": "CASH",
        "items": [
          {
            "productId": "product_id",
            "productName": "Product Name",
            "quantity": 2,
            "price": 500,
            "discount": 0
          }
        ],
        "customer": {
          "id": "customer_id",
          "name": "Customer Name",
          "email": "customer@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 50,
      "pages": 1
    }
  }
}
```

#### POST /api/erp/sales
Create a new sale (POS transaction).

**Request Body:**
```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "productName": "Product Name",
      "quantity": 2,
      "price": 500,
      "discount": 0
    }
  ],
  "subtotal": 1000,
  "discount": 100,
  "total": 900,
  "paymentMethod": "CASH"
}
```

**Response:** 201 Created

#### GET /api/erp/dashboard
Get vendor dashboard statistics.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "todaySales": 5000,
    "weekSales": 25000,
    "monthSales": 100000,
    "topProducts": [
      {
        "productId": "product_id",
        "productName": "Product Name",
        "totalSold": 150
      }
    ],
    "lowStockProducts": [
      {
        "id": "product_id",
        "sku": "SKU001",
        "name": "Product Name",
        "stock": 5,
        "sellingPrice": 150
      }
    ]
  }
}
```

#### GET /api/erp/ai-insights
Get AI-powered insights for the vendor.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "forecast": {
      "week": 27500,
      "month": 115000,
      "trend": "up"
    },
    "recommendations": [
      {
        "productId": "product_id",
        "productName": "Product Name",
        "currentStock": 5,
        "recommendedQuantity": 30,
        "reason": "Stock faible - réapprovisionnement recommandé"
      }
    ],
    "bundles": []
  }
}
```

#### GET /api/erp/customers
Get customers who have ordered from the vendor.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "customer_id",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "0555123456",
        "totalPurchases": 5000,
        "lastPurchaseDate": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### Driver

#### POST /api/driver/location
Update driver location.

**Request Body:**
```json
{
  "latitude": 36.7538,
  "longitude": 3.0588,
  "accuracy": 10,
  "heading": 90,
  "speed": 50,
  "isActive": true,
  "status": "online",
  "currentOrderId": "order_id" // optional
}
```

**Response:** 200 OK

#### GET /api/driver/location
Get driver location.

**Query Parameters:**
- `driverId` (optional): Driver ID
- `orderId` (optional): Order ID

**Response:** 200 OK

#### GET /api/drivers/deliveries
Get available deliveries or driver's assigned deliveries (driver/admin only).

**Query Parameters:**
- `available` (optional): `true` to get available (unassigned) deliveries
- `status` (optional): Filter by order status

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "deliveries": [
      {
        "id": "order_id",
        "status": "READY",
        "customer": {
          "id": "customer_id",
          "name": "Customer Name",
          "phone": "0555123456"
        },
        "store": {
          "id": "store_id",
          "name": "Store Name",
          "address": "Store Address",
          "city": "Algiers"
        },
        "items": [
          {
            "id": "item_id",
            "quantity": 2,
            "product": {
              "id": "product_id",
              "name": "Product Name",
              "price": 500
            }
          }
        ]
      }
    ]
  }
}
```

#### POST /api/drivers/deliveries
Accept a delivery (driver only).

**Request Body:**
```json
{
  "orderId": "order_id"
}
```

**Response:** 200 OK

### Admin

#### GET /api/admin/registration-requests
Get registration requests (admin only).

**Response:** 200 OK

#### POST /api/admin/registration-requests
Approve or reject registration request (admin only).

**Request Body:**
```json
{
  "requestId": "request_id",
  "action": "APPROVE" // or "REJECT"
}
```

**Response:** 200 OK

#### GET /api/admin/users
Get all users (admin only).

**Query Parameters:**
- `role` (optional): Filter by role (`CUSTOMER`, `VENDOR`, `DRIVER`, `ADMIN`)
- `status` (optional): Filter by status (`PENDING`, `APPROVED`, `REJECTED`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "phone": "0555123456",
        "role": "CUSTOMER",
        "status": "APPROVED",
        "city": "Algiers",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

#### GET /api/admin/orders
Get all orders (admin only).

**Query Parameters:**
- `status` (optional): Filter by order status
- `customerId` (optional): Filter by customer
- `vendorId` (optional): Filter by vendor
- `driverId` (optional): Filter by driver
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** 200 OK

## Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Validation

All endpoints use Zod schemas for input validation. Validation errors return a 400 status code with detailed error messages.

## Security Features

- **CSRF Protection**: All POST/PUT/DELETE requests require CSRF token
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Security Headers**: X-Frame-Options, CSP, HSTS, etc.
- **Audit Logging**: All security events are logged
- **Input Validation**: All inputs are validated and sanitized

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Notes

- All timestamps are in ISO 8601 format
- All monetary amounts are in Algerian Dinar (DZD)
- Phone numbers must be in Algerian format: `0[567]xxxxxxxx`
- All IDs are CUIDs (Collision-resistant Unique Identifiers)

