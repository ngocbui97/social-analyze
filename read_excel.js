import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = String.raw`C:\Users\ACER\.gemini\antigravity\brain\6a75b28b-6538-4a79-bde9-3dd142bbc164\report detail from youtubestudio.xlsx`;

try {
  const fileData = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileData, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length > 0) {
    fs.writeFileSync('excel_headers.json', JSON.stringify({ headers: data[0], firstRow: data.length > 1 ? data[1] : null }, null, 2));
    console.log("Wrote to excel_headers.json");
  } else {
    console.log("File is empty.");
  }
} catch (e) {
  console.error("Error reading file:", e.message);
}
