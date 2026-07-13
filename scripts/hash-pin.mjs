// Generates a bcrypt hash for a new admin PIN.
// Usage: node scripts/hash-pin.mjs 4321
// Paste the printed hash into the `settings.pin_hash` column in the
// Supabase Table Editor (table: settings, row id: 1).

import bcrypt from "bcryptjs";

const pin = process.argv[2];
if (!pin) {
  console.error("Usage: node scripts/hash-pin.mjs <new-pin>");
  process.exit(1);
}

console.log(bcrypt.hashSync(pin, 10));
