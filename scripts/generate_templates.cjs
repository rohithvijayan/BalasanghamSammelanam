const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// 1. Delegates Template Data
const delegates = [
  {
    full_name: 'അർജുൻ കെ.',
    phone: '9847011223',
    district: 'Kannur',
    gender: 'boy'
  },
  {
    full_name: 'ഫാത്തിമ ഷെറിൻ',
    phone: '9400281109',
    district: 'Malappuram',
    gender: 'girl'
  },
  {
    full_name: 'ആദർശ് എം.',
    phone: '9847111029',
    district: 'Palakkad',
    gender: 'boy'
  }
];

// 2. Houses Template Data
const houses = [
  {
    name: 'പൂന്തോട്ടം വീട് (Poonthottam House)',
    address: 'വാർഡ് 4, പയ്യന്നൂർ നഗരസഭ, റെയിൽവേ സ്റ്റേഷൻ റോഡ്',
    map_url: 'https://maps.google.com/?q=12.0984,75.2045',
    host_name: 'കെ. രാഘവൻ',
    host_phone: '9447123456',
    capacity: 4,
    gender_restriction: 'boys',
    notes: 'റെയിൽവേ സ്റ്റേഷന് സമീപം'
  },
  {
    name: 'സൗപർണിക (Souparnika)',
    address: 'വാർഡ് 2, കോളേജ് റോഡ്, പയ്യന്നൂർ',
    map_url: 'https://maps.google.com/?q=12.1020,75.2100',
    host_name: 'പ്രൊഫ. സുജാത എം.',
    host_phone: '9846289001',
    capacity: 6,
    gender_restriction: 'girls',
    notes: 'കോളേജ് ജംഗ്ഷൻ'
  }
];

// 3. Volunteers Template Data
const volunteers = [
  {
    name: 'അരുൺ കുമാർ',
    phone: '9400112233',
    unit: 'നീലേശ്വരം (Nileshwaram)'
  },
  {
    name: 'സുഹറ ബീവി',
    phone: '9400223344',
    unit: 'ചെറുവത്തൂർ (Cheruvathur)'
  },
  {
    name: 'വിഷ്ണു ദാസ്',
    phone: '9400334455',
    unit: 'കാഞ്ഞങ്ങാട് (Kanhangad)'
  },
  {
    name: 'അനന്യ എസ്.',
    phone: '9400445566',
    unit: 'പിലിക്കോട് (Pilicode)'
  },
  {
    name: 'രാഹുൽ എം.',
    phone: '9400556677',
    unit: 'മടിക്കൈ (Madikai)'
  }
];

function createXlsx(data, filename, colWidths, phoneFields = []) {
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  // Format phone cells as text '@' so Excel never formats them as scientific notation (e.g. 9.45E+09)
  const range = XLSX.utils.decode_range(ws['!ref']);
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    headers.push(headerCell ? headerCell.v : '');
  }

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = headers[C];
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && phoneFields.includes(header)) {
        cell.t = 's'; // string type
        cell.z = '@'; // text format
        cell.v = String(cell.v);
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const filePath = path.join(templatesDir, filename);
  XLSX.writeFile(wb, filePath);
  console.log('✓ Created XLSX:', filePath);
}

// UTF-8 BOM CSV so Microsoft Excel on Windows automatically detects UTF-8 encoding
function saveCsvWithBom(csvContent, filename) {
  const filePath = path.join(templatesDir, filename);
  const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
  const contentBuf = Buffer.from(csvContent, 'utf8');
  fs.writeFileSync(filePath, Buffer.concat([bom, contentBuf]));
  console.log('✓ Saved CSV with UTF-8 BOM:', filePath);
}

console.log('Generating Excel (.xlsx) templates...');
createXlsx(delegates, 'delegates_template.xlsx', [24, 18, 16, 12], ['phone']);
createXlsx(houses, 'houses_template.xlsx', [36, 44, 42, 22, 18, 12, 18, 30], ['host_phone']);
createXlsx(volunteers, 'volunteers_template.xlsx', [24, 18, 28], ['phone']);

console.log('Generating UTF-8 BOM (.csv) templates...');
const delCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(delegates));
saveCsvWithBom(delCsv, 'delegates_template.csv');

const houseCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(houses));
saveCsvWithBom(houseCsv, 'houses_template.csv');

const volCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(volunteers));
saveCsvWithBom(volCsv, 'volunteers_template.csv');

console.log('All templates generated successfully!');
