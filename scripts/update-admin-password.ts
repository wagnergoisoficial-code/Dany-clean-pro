import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

function updatePassword() {
  const dbPath = path.resolve(process.cwd(), "database.db");
  const db = new Database(dbPath);

  const newPassword = process.env.ADMIN_PASSWORD;

  if (!newPassword) {
    console.error("ADMIN_PASSWORD environment variable is not defined");
    process.exit(1);
  }

  // Check if "administrador" exists
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get("administrador") as { id: number; username: string } | undefined;

  if (!user) {
    console.error("User 'administrador' not found in database.");
    process.exit(1);
  }

  // Hash the new password with 10 salt rounds (same as server.ts)
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  // Update only the password column
  const result = db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hashedPassword, "administrador");

  if (result.changes > 0) {
    console.log("Password updated successfully");
  } else {
    console.error("Failed to update password");
    process.exit(1);
  }
}

updatePassword();
