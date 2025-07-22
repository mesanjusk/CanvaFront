import Dexie from 'dexie';
import CryptoJS from 'crypto-js';

// Secret key for AES encryption - loaded from env for security
const SECRET_KEY = import.meta.env.VITE_DB_SECRET_KEY || 'change_me';

/**
 * Dexie database instance used for offline caching of key app data.
 * Versioned schema allows future upgrades with migrations.
 */
class AppDatabase extends Dexie {
  constructor() {
    super('appDB');
    // Initial schema version
    this.version(1).stores({
      leads: '++id, lead_uuid, institute_uuid',
      students: '++id, student_uuid, institute_uuid',
      attendance: '++id, attendance_uuid, institute_uuid',
      admissions: '++id, admission_uuid, institute_uuid',
      courses: '++id, course_uuid, institute_uuid',
      exams: '++id, exam_uuid, institute_uuid',
      batches: '++id, batch_uuid, institute_uuid'
    });
  }

  /** Encrypt any data (object, string, etc) using AES */
  encrypt(data) {
    const text = JSON.stringify(data);
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  }

  /** Decrypt previously encrypted data */
  decrypt(cipher) {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(text);
  }
}

const db = new AppDatabase();
export default db;
