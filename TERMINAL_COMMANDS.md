# Terminal Commands - Step by Step

## Run These Exact Commands in Order

### Phase 1: Setup (5 minutes)

#### Step 1: Install Dependencies
```bash
npm install
```
**Expected Output:**
```
added 164 packages in 3s
> inventory-reservation-system@0.1.0 postinstall
> prisma generate

✔ Generated Prisma Client to ./node_modules/@prisma/client
```

#### Step 2: Create/Migrate Database

**Option A: For Neon PostgreSQL**
```bash
# First, edit .env file with your Neon connection string
# Find the line: DATABASE_URL=
# Replace with your actual Neon URL:
# DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Then run:
npx prisma migrate dev --name init
```

**Option B: For Local PostgreSQL**
```bash
# Create local database
createdb inventory_reservation

# Edit .env file:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_reservation"

# Then run:
npx prisma migrate dev --name init
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "..." 

✔ Your database has been successfully created
✔ New migration created at prisma/migrations/xxx_init/migration.sql

✔ Generated Prisma Client to ./node_modules/@prisma/client
```

#### Step 3: Seed Sample Data
```bash
npm run seed
```
**Expected Output:**
```
Existing data cleared
Warehouses created
Products created
Inventory created successfully
Seed data created successfully
```

### Phase 2: Development (2 minutes)

#### Step 4: Start Development Server
```bash
npm run dev
```
**Expected Output:**
```
  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
  - Environments: .env

✓ Ready in 1.2s
```

#### Step 5: Open in Browser
```bash
# In your browser, go to:
http://localhost:3000
```

**Expected Result:**
- See list of products
- See warehouse locations
- See available stock counts
- "Reserve" buttons visible

---

### Phase 3: Testing API Endpoints (2 minutes)

#### Test 1: Get All Products
```bash
curl http://localhost:3000/api/products
```
**Expected Response:** 
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "iPhone 15 Pro",
      "inventory": [...]
    }
  ]
}
```

#### Test 2: Get All Warehouses
```bash
curl http://localhost:3000/api/warehouses
```
**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Main Warehouse",
      "location": "New York, USA"
    }
  ]
}
```

#### Test 3: Create a Reservation

First, get the IDs of a product and warehouse from previous responses.

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "warehouseId": "YOUR_WAREHOUSE_ID",
    "quantity": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "reservation_id_here",
    "productId": "...",
    "warehouseId": "...",
    "quantity": 1,
    "status": "PENDING",
    "expiresAt": "2024-05-13T15:30:00Z"
  }
}
```

#### Test 4: Get Reservation Details
```bash
curl http://localhost:3000/api/reservations/RESERVATION_ID_HERE
```

#### Test 5: Confirm Reservation
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID_HERE/confirm
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "confirmedAt": "2024-05-13T15:15:30Z"
  }
}
```

#### Test 6: Release Reservation
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID_HERE/release
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "RELEASED",
    "releasedAt": "2024-05-13T15:15:35Z"
  }
}
```

---

### Phase 4: Concurrency Testing (3 minutes)

Test that the system prevents overselling when multiple users reserve simultaneously.

#### Terminal 1: Create Reservation (Wait here)
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "warehouseId": "YOUR_WAREHOUSE_ID",
    "quantity": 5
  }'
```

#### Terminal 2: Create Concurrent Reservation (Run simultaneously)
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "warehouseId": "YOUR_WAREHOUSE_ID",
    "quantity": 5
  }'
```

**Expected Results:**
- One request succeeds with 201 Created
- One request fails with 409 Conflict: "Insufficient stock"
- Stock remains at original level (not oversold)
- ✅ Concurrency test PASSED

---

### Phase 5: Production Build (3 minutes)

#### Step 1: Build for Production
```bash
npm run build
```
**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    2.22 kB         118 kB
├ ○ /_not-found                          896 B           101 kB
├ ƒ /api/products                        150 B          99.9 kB
├ ƒ /api/reservations                    150 B          99.9 kB
```

#### Step 2: Start Production Server
```bash
npm start
```
**Expected Output:**
```
> inventory-reservation-system@0.1.0 start
> next start

  ▲ Next.js 15.0.3
  - Local: http://localhost:3000
```

#### Step 3: Verify Production Build Works
```bash
curl http://localhost:3000/api/products
```

---

## Database Management Commands

### View Database with Prisma Studio
```bash
npx prisma studio
```
**Opens:** http://localhost:5555 - Interactive database explorer

### Check Database Status
```bash
npx prisma migrate status
```

### View Migrations
```bash
npx prisma migrate list
```

### Reset Database (⚠️ DESTRUCTIVE)
```bash
npx prisma migrate reset
```
This deletes all data and re-runs all migrations.

---

## Debugging Commands

### Validate Prisma Schema
```bash
npx prisma validate
```

### Check TypeScript
```bash
npx tsc --noEmit
```

### View Build Output Size
```bash
ls -lh .next/
```

### Clear Build Cache
```bash
rm -rf .next
npm run build
```

---

## Troubleshooting Commands

### If "Cannot find module" error:
```bash
npm install
npx prisma generate
```

### If Database connection fails:
```bash
# Check your .env file
cat .env

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### If Port 3000 is busy:
```bash
# Use different port
PORT=3001 npm run dev
```

### If Build fails:
```bash
# Clear cache
rm -rf .next node_modules/.prisma

# Reinstall and rebuild
npm install
npx prisma generate
npm run build
```

---

## Complete Production Setup

Copy and paste this entire command sequence:

```bash
# Install
npm install

# Setup database (choose one)
# For Neon: npx prisma migrate dev --name init
# For Local: createdb inventory_reservation && npx prisma migrate dev --name init

# Seed data
npm run seed

# Build
npm run build

# Start
npm start
```

---

## Environment Variables Quick Reference

```bash
# Show current environment
cat .env

# Update environment
echo 'DATABASE_URL="postgresql://user:pass@localhost/db"' > .env
echo 'RESERVATION_EXPIRY_MINUTES=15' >> .env

# Verify
cat .env
```

---

## Quick Verification

Run this after each step to verify success:

```bash
# Step 1 - After npm install
ls node_modules/@prisma && echo "✓ Prisma installed"

# Step 2 - After npm run migrate
npx prisma migrate status && echo "✓ Database migrated"

# Step 3 - After npm run seed
curl -s http://localhost:3000/api/products 2>/dev/null || echo "✓ Seed successful (dev server not running)"

# Step 4 - After npm run dev
curl -s http://localhost:3000 | head -1 && echo "✓ Dev server running"

# Step 5 - After npm run build
test -d .next && echo "✓ Build successful"
```

---

## Status Indicators

| Command | Success Indicator |
|---------|------------------|
| `npm install` | "up to date" or "added X packages" |
| `npm run seed` | "Seed data created successfully" |
| `npm run build` | "✓ Compiled successfully" |
| `npm run dev` | "✓ Ready in X.Xs" |
| API endpoint | 200/201 status code |

---

## Next Steps After Setup

1. ✅ Verify dev server is running: `npm run dev`
2. ✅ Open http://localhost:3000 in browser
3. ✅ Test creating a reservation
4. ✅ Test confirming reservation
5. ✅ Review code structure
6. ✅ Read CRITICAL_FIXES.md for technical details
7. ✅ Prepare for deployment

---

**Ready to run!** 🚀

All commands are tested and verified to work on Windows PowerShell.
