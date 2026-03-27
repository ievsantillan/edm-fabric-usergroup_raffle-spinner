import readXlsxFile from 'read-excel-file';
import Papa from 'papaparse';

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('No data found in the file.'));
          return;
        }
        const columns = results.meta.fields || Object.keys(results.data[0]);
        resolve({ columns, rows: results.data });
      },
      error: (err) => reject(new Error(err.message || 'Failed to parse CSV.')),
    });
  });
}

async function parseExcel(file) {
  const rows = await readXlsxFile(file);
  if (!rows || rows.length < 2) {
    throw new Error('No data found in the file.');
  }
  const columns = rows[0].map((h) => String(h ?? '').trim());
  const data = rows.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i] != null ? String(row[i]) : '';
    });
    return obj;
  });
  return { columns, rows: data };
}

export function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    return parseCSV(file);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }
  return Promise.reject(new Error('Unsupported file type.'));
}
