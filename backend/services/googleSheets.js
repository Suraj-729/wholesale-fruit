import { google } from "googleapis";
import { badRequest } from "../middleware/errorHandler.js";

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
if (!spreadsheetId) console.warn("GOOGLE_SHEET_ID is not set. Add it to backend/.env before using the API.");

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const TABLES = {
  users: { sheet: "Users", headers: ["Username", "Password", "Role"] },
  retailers: { sheet: "Retailers", headers: ["MobileNumber", "RetailerName", "ShopName", "Address", "CreatedDate"] },
  fruits: { sheet: "Fruits", headers: ["FruitID", "FruitName", "PackageType", "AvailableQuantity", "Price", "CreatedDate"] },
  orders: { sheet: "Orders", headers: ["OrderID", "RetailerMobile", "RetailerName", "FruitID", "FruitName", "PackageType", "Quantity", "Price", "Total", "Status", "OrderDate"] },
};

function config(table) {
  const found = TABLES[table];
  if (!found) throw badRequest(`Unknown sheet table: ${table}`);
  if (!spreadsheetId) throw badRequest("Google Sheets is not configured. Set GOOGLE_SHEET_ID in backend/.env.");
  return found;
}

function toColumn(number) {
  let result = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

function rowToObject(headers, row, rowNumber) {
  return headers.reduce((record, header, index) => ({ ...record, [header]: row[index] ?? "" }), { _row: rowNumber });
}

function objectToRow(headers, data) {
  return headers.map((header) => data[header] ?? "");
}

export async function getRows(table) {
  const { sheet, headers } = config(table);
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheet}!A2:${toColumn(headers.length)}` });
  return (response.data.values || []).map((row, index) => rowToObject(headers, row, index + 2));
}

export async function findRow(table, field, value) {
  const rows = await getRows(table);
  return rows.find((row) => String(row[field]) === String(value));
}

export async function insertRow(table, data) {
  const { sheet, headers } = config(table);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheet}!A:${toColumn(headers.length)}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [objectToRow(headers, data)] },
  });
  return data;
}

export const appendOrder = (data) => insertRow("orders", data);

export async function updateRow(table, rowNumber, data) {
  const { sheet, headers } = config(table);
  const existing = (await getRows(table)).find((row) => row._row === rowNumber);
  if (!existing) throw badRequest("The row to update no longer exists.");
  const merged = { ...existing, ...data };
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheet}!A${rowNumber}:${toColumn(headers.length)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [objectToRow(headers, merged)] },
  });
  return merged;
}

export async function deleteRow(table, rowNumber) {
  const { sheet } = config(table);
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties(sheetId,title)" });
  const target = metadata.data.sheets?.find(({ properties }) => properties.title === sheet);
  if (!target?.properties || target.properties.sheetId === undefined) throw badRequest(`Worksheet '${sheet}' was not found.`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ deleteDimension: { range: { sheetId: target.properties.sheetId, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber } } }] },
  });
}

export async function nextId(table, field, prefix, padding) {
  const rows = await getRows(table);
  const largest = rows.reduce((max, row) => Math.max(max, Number(String(row[field]).replace(prefix, "")) || 0), 0);
  return `${prefix}${String(largest + 1).padStart(padding, "0")}`;
}

export const updateStock = (fruitRow, quantity) => updateRow("fruits", fruitRow._row, { AvailableQuantity: quantity });
