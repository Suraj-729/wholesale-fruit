# FruitLane Wholesale

Local wholesale fruit warehouse application. The React frontend and Express API share one Excel database: `backend/warehouse-database.xlsx`.

## Start the backend

```powershell
cd "D:\wholesale fruit\backend"
npm run dev
```

The API runs on `http://localhost:5000` and writes all fruits, retailers, stock changes, and orders into the local Excel file. Keep the workbook closed in Excel while the app is making changes.

## Start the frontend

```powershell
cd "D:\wholesale fruit"
npm run dev
```

Open `http://localhost:5173`.

## Demo access

- Wholesaler: `admin` / `ChangeMe123!`
- Retailer: an existing registered mobile number, then OTP `123456`

Use the Wholesale desk to register retailers and add, update, or delete fruit lots.
