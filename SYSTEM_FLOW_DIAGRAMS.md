## 1. High-Level System Flow

```
┌──────────────┐
│   CLIENT     │
│  (Browser)   │
└──────┬───────┘
       │
       │ HTTP Request
       ▼
┌──────────────┐
│    NGINX     │
│ Load Balancer│
└──────┬───────┘
       │
       │ Distribute to Backend
       ├─────────┬─────────┬─────────┐
       ▼         ▼         ▼         ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Backend│  │Backend│  │Backend│  │Backend│
   │ 5000  │  │ 5001 │  │ 5002 │  │ 5003 │
   └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌──────┐   ┌──────┐   ┌──────┐
    │Redis │   │Postgres│  │Kafka │
    │Cache │   │  DB    │  │  MQ  │
    └──────┘   └──────┘   └───┬──┘
                              │
                              ▼
                         ┌──────────┐
                         │ Consumers│
                         │ (Email)  │
                         └──────────┘
```

---

## 2. User Registration Flow

```
User → Frontend → Backend → PostgreSQL
                          ↓
                    Create User
                          ↓
                    Generate OTP
                          ↓
                    Store OTP (Memory)
                          ↓
                    Send Email (SMTP)
                          ↓
                    Return Response
                          ↓
User → Frontend → Backend → Verify OTP
                          ↓
                    Check OTP Store
                          ↓
                    Update User (isVerified)
                          ↓
                    Generate JWT Token
                          ↓
                    Return Token
```

---

## 3. Product Listing Flow (With Cache)

```
User Request
    │
    ▼
┌─────────┐
│  Nginx  │
└────┬────┘
     │
     ▼
┌─────────┐
│ Backend │
└────┬────┘
     │
     ▼
┌─────────┐
│  Redis  │─── Cache Hit? ──YES──► Return Cached Data (5ms)
│  Cache  │
└────┬────┘
     │ NO
     ▼
┌─────────┐
│Postgres │─── Query Products ──► Return Data (50ms)
│   DB    │
└────┬────┘
     │
     ▼
┌─────────┐
│  Redis  │─── Store in Cache ──► Return to User
│  Cache │
└─────────┘
```

---

## 4. Add to Cart Flow

```
User → POST /products/addtocart
    │
    ▼
┌─────────┐
│ JWT     │─── Verify Token
│ Auth    │
└────┬────┘
     │ Valid
     ▼
┌─────────┐
│ Check   │─── Cart Exists?
│  Cart   │
└────┬────┘
     │
     ├─ YES ──► Get Cart
     │
     └─ NO ───► Create Cart
            │
            ▼
     ┌─────────┐
     │ Check   │─── Item in Cart?
     │  Item   │
     └────┬────┘
          │
          ├─ YES ──► Update Quantity
          │
          └─ NO ───► Add New Item
                 │
                 ▼
          ┌─────────┐
          │Postgres │─── Save Changes
          │   DB    │
          └─────────┘
```

---

## 5. Order Placement Flow

```
User → POST /products/placeorder
    │
    ▼
┌─────────┐
│ Get     │─── Fetch Cart Items
│  Cart   │
└────┬────┘
     │
     ▼
┌─────────┐
│Validate │─── Check Stock for Each Item
│ Stock   │
└────┬────┘
     │
     ▼
┌─────────┐
│ Update  │─── Decrement Stock
│Inventory│
└────┬────┘
     │
     ▼
┌─────────┐
│ Create  │─── Create Order + OrderItems
│ Order   │
└────┬────┘
     │
     ▼
┌─────────┐
│ Clear   │─── Delete Cart + CartItems
│  Cart   │
└────┬────┘
     │
     ▼
┌─────────┐
│ Kafka   │─── Publish Order Message
│Producer │
└────┬────┘
     │
     ▼
┌─────────┐
│ Return  │─── Order Confirmation (200ms)
│Response │
└─────────┘

     (Async - Doesn't block response)
     │
     ▼
┌─────────┐
│ Kafka   │─── Consume Order Message
│Consumer │
└────┬────┘
     │
     ▼
┌─────────┐
│  SMTP   │─── Send Order Email
│ Server  │
└─────────┘
```

---

## 6. Cache Invalidation Flow

```
Admin → POST /upload-product
    │
    ▼
┌─────────┐
│ Create  │─── Create Product in DB
│Product  │
└────┬────┘
     │
     ▼
┌─────────┐
│Invalidate│─── Delete Cache Keys:
│  Cache  │    - all_products
│         │    - products_with_images
│         │    - total_products
└────┬────┘
     │
     ▼
┌─────────┐
│  Redis  │─── Cache Cleared
│  Cache  │
└─────────┘
```

---

## 7. Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/userLogin
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ Query User
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │
       │ Return User
       ▼
┌─────────────┐
│   Backend   │─── Verify Password (bcrypt)
└──────┬──────┘
       │
       │ Check isVerified
       ▼
┌─────────────┐
│   Backend   │─── Generate JWT Token
└──────┬──────┘
       │
       │ Return Token
       ▼
┌─────────────┐
│   Client    │─── Store in localStorage
└─────────────┘
```

---

## 8. Protected Route Flow

```
Client Request
    │
    │ GET /products/cartitems
    │ Headers: Authorization: Bearer <token>
    ▼
┌─────────────┐
│  Middleware │─── Extract Token
│  (JWT Auth) │
└──────┬──────┘
       │
       │ Verify Token
       ▼
┌─────────────┐
│   JWT       │─── Decode & Validate
│  Library    │
└──────┬──────┘
       │
       ├─ Valid ──► Add req.user → Continue to Route
       │
       └─ Invalid ──► Return 401 Unauthorized
```

---

## 9. Kafka Message Flow

```
┌─────────────┐
│  Backend    │─── Order Created
│  (Producer)│
└──────┬──────┘
       │
       │ publishOrder()
       ▼
┌─────────────┐
│   Kafka     │─── Topic: order-placed
│   Broker    │
└──────┬──────┘
       │
       │ Message Queue
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Email   │   │Inventory │   │  (Future)│
│Consumer  │   │Consumer   │   │Consumer  │
└────┬─────┘   └────┬─────┘   └──────────┘
     │             │
     │             │ (Empty - just logs)
     ▼             ▼
┌──────────┐   ┌──────────┐
│   SMTP   │   │  Console │
│  Server  │   │   Log    │
└──────────┘   └──────────┘
```

---

## 10. Load Balancing Flow

```
Client Request
    │
    ▼
┌─────────────┐
│    Nginx    │─── Route based on path
│ Load Balancer│
└──────┬──────┘
       │
       ├─ /api/* ──────────┐
       │                    │
       ├─ /products/* ──────┤
       │                    │
       └─ /stats/* ─────────┤
                            │
                            ▼
                    ┌───────────────┐
                    │  Upstream     │
                    │  Backend Pool │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
        ┌──────┐       ┌──────┐       ┌──────┐
        │Inst 1│       │Inst 2│       │Inst 3│
        │:5000 │       │:5001 │       │:5002 │
        └──────┘       └──────┘       └──────┘
            │               │               │
            └───────────────┴───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Response    │
                    │   to Client   │
                    └───────────────┘
```

---

## 11. Redis Cache Strategy

```
Read Request
    │
    ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ redisClient.get(key)
       ▼
┌─────────────┐
│    Redis    │
└──────┬──────┘
       │
       ├─ HIT ──► Return Cached Data (5ms) ──► Response
       │
       └─ MISS ──► Query Database
                  │
                  ▼
            ┌─────────────┐
            │ PostgreSQL  │
            └──────┬───────┘
                  │
                  │ Return Data (50ms)
                  ▼
            ┌─────────────┐
            │   Backend    │─── redisClient.set(key, data, TTL)
            └──────┬───────┘
                  │
                  ▼
            ┌─────────────┐
            │    Redis     │─── Store in Cache
            └──────┬───────┘
                  │
                  ▼
            ┌─────────────┐
            │   Response  │
            └─────────────┘
```

---

## 12. Error Handling Flow

```
Request
    │
    ▼
┌─────────────┐
│   Route     │
└──────┬──────┘
       │
       ├─ Success ──► Return 200 + Data
       │
       ├─ Validation Error ──► Return 400 + Error Message
       │
       ├─ Auth Error ──► Return 401 + "Unauthorized"
       │
       ├─ Not Found ──► Return 404 + "Not Found"
       │
       └─ Server Error ──► Return 500 + "Internal Server Error"
                            │
                            ▼
                    ┌─────────────┐
                    │   Log Error │
                    │  (Console)  │
                    └─────────────┘
```

---

## Quick Reference: Component Interactions

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │◄───────►│  Nginx   │◄───────►│ Backend  │
└──────────┘         └──────────┘         └────┬─────┘
                                                │
                    ┌──────────────────────────┼──────────────────┐
                    │                          │                  │
                    ▼                          ▼                  ▼
              ┌──────────┐              ┌──────────┐      ┌──────────┐
              │  Redis   │              │Postgres  │      │  Kafka   │
              │  Cache   │              │   DB     │      │   MQ     │
              └──────────┘              └──────────┘      └────┬─────┘
                                                               │
                                                               ▼
                                                        ┌──────────┐
                                                        │Consumers │
                                                        │ (Email)  │
                                                        └──────────┘
```

---

*Flow Diagrams - Quick Reference Guide*

