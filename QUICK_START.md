# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```
**Expected Output:** 164 packages installed, Prisma generated

### Step 2: Setup Database

**For Neon PostgreSQL (Cloud):**
```bash
# Edit .env file with your Neon connection string
# DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

npx prisma migrate dev --name init
```

**For Local PostgreSQL:**
```bash
# Create database
createdb inventory_reservation

# Update .env
# DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_reservation"

npx prisma migrate dev --name init
```

### Step 3: Seed Sample Data
```bash
npm run seed
```
**Expected Output:** Seed data created successfully

### Step 4: Start Development Server
```bash
npm run dev
```
**Expected Output:** 
```
  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
```

### Step 5: Open in Browser
```
http://localhost:3000
```

---

## 🔨 Build for Production

```bash
npm run build
npm start
```

---

## 📋 Testing the Reservation System

### Via Browser
1. Open http://localhost:3000
2. Browse products and warehouses
3. Click "Reserve" button
4. Confirm or release reservation
5. Watch countdown timer

### Via API (cURL)

**Get all products:**
```bash
curl http://localhost:3000/api/products
```

**Create a reservation:**
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "warehouseId": "WAREHOUSE_ID",
    "quantity": 1
  }'
```

**Get reservation details:**
```bash
curl http://localhost:3000/api/reservations/RESERVATION_ID
```

**Confirm reservation:**
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm
```

**Release reservation:**
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/release
```

---

## ⚡ Concurrency Testing

Test that the system prevents overselling when two users reserve simultaneously:

```bash
# Open two terminals

# Terminal 1: Make first reservation request
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"PROD_ID","warehouseId":"WAREHOUSE_ID","quantity":5}'

# Terminal 2: Make second reservation request simultaneously (for same product)
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"PROD_ID","warehouseId":"WAREHOUSE_ID","quantity":5}'

# Expected: One succeeds (201), one fails with 409 Conflict
```

---

## 🔍 Viewing Data

### Prisma Studio
```bash
npx prisma studio
```
Opens interactive database explorer at http://localhost:5555

### Database Queries
```bash
# View schema
npx prisma validate

# Check migrations
npx prisma migrate status
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` |
| `Database connection error` | Check DATABASE_URL in .env |
| `Port 3000 already in use` | Use `PORT=3001 npm run dev` |
| `Prisma error` | Run `npx prisma generate` |
| `Build fails` | Clear cache: `rm -rf .next && npm run build` |

---

## 📝 Environment Variables

Create `.env` file:
```env
# Database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/inventory_reservation"

# Reservation expiry time in minutes
RESERVATION_EXPIRY_MINUTES=15
```

---

## ✅ Verification

After running, verify everything works:

```bash
# Check if dev server started
curl -s http://localhost:3000 | head -20

# Check if API works
curl http://localhost:3000/api/products

# Check database connection
npx prisma db execute --stdin < query.sql
```

---

## 📦 What's Included

✅ Full Next.js 15 App Router setup  
✅ PostgreSQL with Prisma ORM  
✅ TypeScript strict mode  
✅ Tailwind CSS + shadcn/ui components  
✅ Concurrency-safe reservation system  
✅ Real-time countdown timers  
✅ Production-ready error handling  
✅ All dependencies installed  

---

## 🎯 Key Features Verified

✅ npm install works  
✅ Prisma generates successfully  
✅ npm run build succeeds (0 errors)  
✅ npm run dev starts server  
✅ npm run seed populates database  
✅ All API routes functional  
✅ Concurrency safety implemented  
✅ UI components render correctly  

---

## 📞 Support

For issues:
1. Check `.env` file is configured correctly
2. Verify PostgreSQL is running
3. Review FIXES_APPLIED.md for detailed changes
4. Check terminal output for error messages

---

**Ready to run!** 🚀
