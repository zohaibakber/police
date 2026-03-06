import Database from "@tauri-apps/plugin-sql";
import type { FIR } from "@/components/data-table/schema";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:fir.db");
  }
  return db;
}

type FirRow = {
  id: number;
  serial_number: number;
  fir: string;
  dated: string;
  police_station: string;
  complainant_name: string;
  id_card_number: string;
  mobile_number: string;
  prepared_and_dispatched_by: string;
  writer: string;
  date_of_incident: string;
  status: string;
};

export async function getFirRecords(): Promise<FIR[]> {
  const database = await getDatabase();
  const rows = (await database.select<FirRow[]>(
    "SELECT * FROM fir ORDER BY serial_number"
  )) as FirRow[];

  return rows.map((row) => ({
    id: row.id,
    serialNumber: row.serial_number,
    fir: row.fir,
    dated: row.dated,
    policeStation: row.police_station,
    complainantName: row.complainant_name,
    idCardNumber: row.id_card_number,
    mobileNumber: row.mobile_number,
    preparedAndDispatchedBy: row.prepared_and_dispatched_by,
    writer: row.writer,
    dateOfIncident: row.date_of_incident,
    status: row.status as FIR["status"],
  }));
}

export async function seedFirDataIfEmpty(): Promise<void> {
  const database = await getDatabase();
  const rows = (await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM fir"
  )) as { count: number }[];
  if (rows[0]?.count > 0) return;

  const seedData = [
    [1, "FIR-2024-001", "2024-01-15", "Central Police Station", "Ahmed Khan", "35201-1234567-1", "0300-1234567", "Constable Ali Hassan", "SI Muhammad Raza", "2024-01-14", "registered"],
    [2, "FIR-2024-002", "2024-01-16", "Model Town Police Station", "Fatima Bibi", "35202-7654321-2", "0321-9876543", "Constable Usman Ahmed", "SI Khalid Mahmood", "2024-01-15", "under_investigation"],
    [3, "FIR-2024-003", "2024-01-17", "Gulberg Police Station", "Hassan Ali", "35203-1122334-3", "0333-5556677", "Constable Bilal Khan", "SI Asadullah", "2024-01-16", "closed"],
    [4, "FIR-2024-004", "2024-01-18", "Cantt Police Station", "Sanaullah Khan", "35204-5566778-4", "0345-1112233", "Constable Imran Shah", "SI Farooq Ahmed", "2024-01-17", "pending"],
    [5, "FIR-2024-005", "2024-01-19", "DHA Police Station", "Zainab Akhtar", "35205-9988776-5", "0301-4445566", "Constable Rashid Mehmood", "SI Tariq Mahmood", "2024-01-18", "registered"],
  ];

  for (let i = 0; i < seedData.length; i++) {
    const [serialNumber, fir, dated, policeStation, complainantName, idCardNumber, mobileNumber, preparedAndDispatchedBy, writer, dateOfIncident, status] = seedData[i];
    await database.execute(
      `INSERT INTO fir (serial_number, fir, dated, police_station, complainant_name, id_card_number, mobile_number, prepared_and_dispatched_by, writer, date_of_incident, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [serialNumber, fir, dated, policeStation, complainantName, idCardNumber, mobileNumber, preparedAndDispatchedBy, writer, dateOfIncident, status]
    );
  }
}

export async function getNextSerialNumber(): Promise<number> {
  const database = await getDatabase();
  const rows = (await database.select<{ max: number | null }[]>(
    "SELECT MAX(serial_number) as max FROM fir"
  )) as { max: number | null }[];
  const max = rows[0]?.max ?? 0;
  return max + 1;
}

export type FirInsert = Omit<FIR, "id">;

export async function insertFirRecord(data: FirInsert): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    `INSERT INTO fir (serial_number, fir, dated, police_station, complainant_name, id_card_number, mobile_number, prepared_and_dispatched_by, writer, date_of_incident, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      data.serialNumber,
      data.fir,
      data.dated,
      data.policeStation,
      data.complainantName,
      data.idCardNumber,
      data.mobileNumber,
      data.preparedAndDispatchedBy,
      data.writer,
      data.dateOfIncident,
      data.status,
    ]
  );
  return result.lastInsertId ?? 0;
}

export async function updateFirRecord(data: FIR): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    `UPDATE fir SET serial_number = $1, fir = $2, dated = $3, police_station = $4, complainant_name = $5, id_card_number = $6, mobile_number = $7, prepared_and_dispatched_by = $8, writer = $9, date_of_incident = $10, status = $11 WHERE id = $12`,
    [
      data.serialNumber,
      data.fir,
      data.dated,
      data.policeStation,
      data.complainantName,
      data.idCardNumber,
      data.mobileNumber,
      data.preparedAndDispatchedBy,
      data.writer,
      data.dateOfIncident,
      data.status,
      data.id,
    ]
  );
}

export async function deleteFirRecord(id: number): Promise<void> {
  const database = await getDatabase();
  await database.execute("DELETE FROM fir WHERE id = $1", [id]);
}
