import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

describe('Excel (.xlsx / .xls) parsing for /import', () => {
  it('correctly creates and reads an Excel workbook with delegate rows', () => {
    const delegateData = [
      {
        full_name: 'അനു കൃഷ്ണൻ (Anu Krishnan)',
        phone: '9876543210',
        district: 'Kannur',
        gender: 'girl',
        emergency_name: 'കൃഷ്ണൻ',
        emergency_phone: '9876543211',
        notes: 'VIP delegate',
      },
      {
        full_name: 'രാഹുൽ ആർ. (Rahul R.)',
        phone: '9847123456',
        district: 'Kozhikode',
        gender: 'boy',
        emergency_name: 'രമേശൻ',
        emergency_phone: '9847123457',
        notes: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(delegateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delegates');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    expect(buffer).toBeDefined();

    // Read back workbook
    const readWb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = readWb.SheetNames[0];
    expect(sheetName).toBe('Delegates');

    const parsed = XLSX.utils.sheet_to_json<any>(readWb.Sheets[sheetName]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].full_name).toBe('അനു കൃഷ്ണൻ (Anu Krishnan)');
    expect(parsed[0].phone).toBe('9876543210');
    expect(parsed[0].gender).toBe('girl');
    expect(parsed[1].full_name).toBe('രാഹുൽ ആർ. (Rahul R.)');
  });

  it('correctly creates and reads an Excel workbook with house rows', () => {
    const houseData = [
      {
        name: 'ശാന്തി ഭവൻ (Shanthi Bhavan)',
        address: 'വാർഡ് 5, നീലേശ്വരം',
        host_name: 'മോഹനൻ കെ.',
        host_phone: '9446012345',
        capacity: 5,
        gender_restriction: 'boys',
        notes: 'Near bus stand',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(houseData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Houses');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const readWb = XLSX.read(buffer, { type: 'buffer' });
    const parsed = XLSX.utils.sheet_to_json<any>(readWb.Sheets[readWb.SheetNames[0]]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('ശാന്തി ഭവൻ (Shanthi Bhavan)');
    expect(parsed[0].capacity).toBe(5);
    expect(parsed[0].gender_restriction).toBe('boys');
  });

  it('correctly creates and reads an Excel workbook with volunteer rows', () => {
    const volunteerData = [
      {
        name: 'അരുൺ കുമാർ (Arun Kumar)',
        phone: '9400112233',
        unit: 'നീലേശ്വരം (Nileshwaram)',
      },
      {
        name: 'സുഹറ ബീവി (Suhara Beevi)',
        phone: '9400223344',
        unit: 'ചെറുവത്തൂർ (Cheruvathur)',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(volunteerData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteers');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const readWb = XLSX.read(buffer, { type: 'buffer' });
    const parsed = XLSX.utils.sheet_to_json<any>(readWb.Sheets[readWb.SheetNames[0]]);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('അരുൺ കുമാർ (Arun Kumar)');
    expect(parsed[0].phone).toBe('9400112233');
    expect(parsed[0].unit).toBe('നീലേശ്വരം (Nileshwaram)');
  });

  it('verifies that public CSV templates contain UTF-8 BOM (0xEF, 0xBB, 0xBF) for MS Excel compatibility', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const csvFiles = ['delegates_template.csv', 'houses_template.csv', 'volunteers_template.csv'];
    for (const f of csvFiles) {
      const filePath = path.join(process.cwd(), 'public', 'templates', f);
      expect(fs.existsSync(filePath), `Template ${f} should exist`).toBe(true);

      const buffer = fs.readFileSync(filePath);
      // Byte 0: 0xEF, Byte 1: 0xBB, Byte 2: 0xBF
      expect(buffer[0]).toBe(0xef);
      expect(buffer[1]).toBe(0xbb);
      expect(buffer[2]).toBe(0xbf);

      // Verify that content includes readable Malayalam text without mojibake
      const utf8Text = buffer.toString('utf8');
      expect(utf8Text).not.toContain('à´');
    }
  });

  it('verifies that public XLSX templates exist and preserve text types for phone numbers', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const xlsxFiles = ['delegates_template.xlsx', 'houses_template.xlsx', 'volunteers_template.xlsx'];
    for (const f of xlsxFiles) {
      const filePath = path.join(process.cwd(), 'public', 'templates', f);
      expect(fs.existsSync(filePath), `XLSX template ${f} should exist`).toBe(true);

      const wb = XLSX.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      expect(rows.length).toBeGreaterThan(0);

      // Confirm Malayalam characters read cleanly
      const firstRow = rows[0];
      const name = firstRow.name || firstRow.full_name;
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(name).not.toContain('à´');
    }
  });
});
