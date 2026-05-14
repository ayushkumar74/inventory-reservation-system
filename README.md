# Inventory Reservation System

A complete inventory reservation system built with Next.js 15, Prisma, and PostgreSQL. This system allows users to browse products, reserve stock from warehouses, and manage reservations with automatic expiry handling.

## Features

- **Product Listing**: Browse products with real-time stock availability across multiple warehouses
- **Stock Reservation**: Reserve stock temporarily with automatic expiry
- **Concurrent Request Handling**: Prevents overselling using database transactions with serializable isolation
- **Real-time Updates**: Countdown timer for reservation expiry
- **Reservation Management**: Confirm or release reservations
- **Lazy Cleanup**: Automatically releases expired reservations on next operation

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Custom shadcn/ui-style components
- **Notifications**: Sonner (toast notifications)
- **Validation**: Zod

## Architecture

### Database Models

- **Product**: Product information (name, description, price, SKU)
- **Warehouse**: Warehouse locations
- **Inventory**: Stock tracking per product per warehouse (totalStock, reservedStock)
- **Reservation**: Reservation records with status (PENDING, CONFIRMED, RELEASED)

### Key Business Logic

**Available Stock Calculation**:
```
availableStock = totalStock - reservedStock
```

**Reservation Flow**:
1. Validate stock availability
2. Clean up expired reservations (lazy cleanup)
3. Create reservation with PENDING status
4. Increment reservedStock
5. Commit transaction (serializable isolation)

**Confirmation Flow**:
- Change status to CONFIRMED
- Stock already reserved, no additional changes needed

**Release Flow**:
- Change status to RELEASED
- Decrement reservedStock (only if was PENDING)

### Concurrency Handling

The system uses **Prisma transactions with serializable isolation level** to prevent race conditions:

- When two users try to reserve the last unit simultaneously, exactly one succeeds
- The other fails with a 409 Conflict error
- Row-level locking ensures data consistency
- Lazy cleanup of expired reservations happens before each reservation attempt

### Expiry Handling

Instead of cron jobs, the system uses a **lazy cleanup strategy**:
- Expired reservations are cleaned up automatically when a new reservation is attempted for the same product/warehouse
- This reduces complexity and infrastructure requirements
- The frontend shows a countdown timer for user awareness

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Neon cloud)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure your database URL:

```env
# For local PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_reservation?schema=public"

# For Neon PostgreSQL (recommended for production)
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Reservation expiry in minutes (default: 15)
RESERVATION_EXPIRY_MINUTES=15
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed Database with Sample Data

```bash
npx tsx prisma/seed.ts
```

This creates:
- 2 warehouses (Main Warehouse, West Coast Warehouse)
- 6 products (iPhone, MacBook, AirPods, Gaming Mouse, Mechanical Keyboard, 4K Monitor)
- Inventory records with random stock levels

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Products
- `GET /api/products` - Get all products with inventory

### Warehouses
- `GET /api/warehouses` - Get all warehouses

### Reservations
- `POST /api/reservations` - Create a new reservation
  - Body: `{ productId, warehouseId, quantity }`
  - Success: 201 with reservation data
  - Conflict (409): Insufficient stock
- `GET /api/reservations/[id]` - Get reservation details
- `POST /api/reservations/[id]/confirm` - Confirm a reservation
  - Success: 200 with updated reservation
  - Gone (410): Reservation has expired
- `POST /api/reservations/[id]/release` - Release a reservation
  - Success: 200 with updated reservation

## Testing Concurrency

To test the concurrent reservation handling:

1. Open two browser tabs
2. Navigate to the same product with 1 unit available
3. Click "Reserve" simultaneously in both tabs
4. One will succeed and redirect to the reservation page
5. The other will show an error: "Insufficient stock - another user may have reserved it"

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` (use Neon for PostgreSQL)
   - `RESERVATION_EXPIRY_MINUTES=15`
4. Deploy

### Neon PostgreSQL Setup

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it as `DATABASE_URL` in environment variables

### Post-Deployment Database Setup

After deployment, run migrations and seed on the production database:

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

## Tradeoffs

### Why Lazy Cleanup Instead of Cron Jobs?

**Pros**:
- Simpler architecture (no background workers)
- Lower infrastructure cost
- Easier to deploy and maintain
- Sufficient for most use cases

**Cons**:
- Expired reservations persist until next operation
- Not ideal for systems requiring immediate cleanup
- Could accumulate many expired reservations in low-traffic scenarios

### Why Serializable Isolation?

**Pros**:
- Strongest isolation level
- Prevents all race conditions
- Simple to reason about
- No need for explicit row locking

**Cons**:
- Lower throughput under high concurrency
- More database contention
- Could impact performance at scale

For this project, serializable isolation is appropriate because:
- Reservation operations are relatively infrequent
- Correctness is more important than performance
- The system is designed for interviews/demonstrations

## Future Improvements

1. **Authentication**: Add user accounts and login
2. **Pagination**: For large product catalogs
3. **Search & Filters**: Better product discovery
4. **Reservation History**: User's past reservations
5. **Admin Dashboard**: Manage inventory and reservations
6. **Optimistic Locking**: Alternative to serializable isolation for better performance
7. **Background Cleanup**: Cron job or queue worker for expired reservations
8. **Email Notifications**: Notify users before expiry
9. **Analytics**: Track reservation patterns
10. **Multi-tenancy**: Support multiple organizations

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/
│   │   ├── warehouses/
│   │   └── reservations/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── reservation/[id]/page.tsx
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── validations.ts
├── services/
│   ├── reservation.service.ts
│   ├── product.service.ts
│   └── warehouse.service.ts
└── types/
    └── index.ts
prisma/
├── schema.prisma
└── seed.ts
```

## License

MIT
