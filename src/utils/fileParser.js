import readXlsxFile from 'read-excel-file/browser';
import Papa from 'papaparse';

/**
 * Normalise a raw header list: trim, fill blanks with "Column N", and
 * de-duplicate by suffixing collisions ("Name", "Name (2)", ...).
 */
function normaliseHeaders(rawHeaders) {
  const seen = new Map();
  return rawHeaders.map((h, i) => {
    let name = String(h ?? '').trim();
    if (!name) name = `Column ${i + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name} (${count + 1})`;
  });
}

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data ?? [];
        if (data.length < 2) {
          reject(new Error('No data found in the file.'));
          return;
        }
        const columns = normaliseHeaders(data[0]);
        const rows = data.slice(1).map((row) => {
          const obj = {};
          columns.forEach((col, i) => {
            const cell = row[i];
            obj[col] = cell != null ? String(cell).trim() : '';
          });
          return obj;
        });
        resolve({ columns, rows });
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
  const columns = normaliseHeaders(rows[0]);
  const data = rows.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      const cell = row[i];
      obj[col] = cell != null ? String(cell).trim() : '';
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
