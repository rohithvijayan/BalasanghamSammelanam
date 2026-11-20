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
});
