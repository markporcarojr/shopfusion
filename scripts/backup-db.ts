import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "prisma", "shopfusion.db");
const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups");

function backup() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found:", DB_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const backupPath = path.join(BACKUP_DIR, `shopfusion_${timestamp}.db`);

  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`✓ Backup created: ${backupPath}`);

  // Keep only last 10 backups
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".db"))
    .sort();

  if (backups.length > 10) {
    const toDelete = backups.slice(0, backups.length - 10);
    toDelete.forEach((f) => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`Deleted old backup: ${f}`);
    });
  }
}

backup();
