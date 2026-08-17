/* ==========================================================
   ErasureX — mock data & storage layer
   In production these would be replaced by:
   - Native device agent (SMART / NVMe identify / Android ADB)
   - Backend API + database (see README for suggested stack)
   ========================================================== */

const DEVICE_POOL = [
  { type: "HDD",  name: "Seagate Barracuda 1TB", iface: "SATA", capacity: "1 TB",  serial: "S-2K9X7A1" },
  { type: "SSD",  name: "Samsung 870 EVO 512GB",  iface: "SATA", capacity: "512 GB", serial: "SS-88CJ4Q" },
  { type: "NVMe", name: "WD Black SN770 1TB",     iface: "NVMe", capacity: "1 TB",  serial: "NV-7712XZ" },
  { type: "Android", name: "Samsung Galaxy A54",  iface: "OTG",  capacity: "128 GB", serial: "AND-44F0P1" }
];

const METHODS = {
  HDD:     { name: "NIST 800-88 Purge — Multi-pass overwrite", desc: "3-pass overwrite (zeros, random, verify) per NIST SP 800-88 Rev.1 Purge guidance for magnetic media.",
             steps: ["Pass 1/3 — writing zero pattern", "Pass 2/3 — writing pseudo-random pattern", "Pass 3/3 — verification read-back"] },
  SSD:     { name: "NIST 800-88 Purge — Crypto erase + overwrite", desc: "Cryptographic erase of the media encryption key followed by ATA Secure Erase and verification pass.",
             steps: ["Issuing ATA Secure Erase command", "Destroying media encryption key", "Verifying erasure pattern"] },
  NVMe:    { name: "NIST 800-88 Purge — NVMe Sanitize (Crypto Erase)", desc: "NVMe Sanitize command with crypto-erase action, block erase fallback, and full verification.",
             steps: ["Issuing NVMe Sanitize (crypto erase)", "Polling sanitize status log", "Verifying LBA read-back"] },
  Android: { name: "Factory Reset + Crypto Erase", desc: "Full data partition wipe with encryption key destruction, matching NIST 800-88 Clear for mobile flash media.",
             steps: ["Destroying FBE encryption keys", "Wiping /data partition", "Verifying factory-reset state"] }
};

const STORAGE_KEY = "erasurex_records_v1";

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function addRecord(record) {
  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  return records;
}
function findRecord(certId) {
  return loadRecords().find(r => r.certId.toLowerCase() === certId.trim().toLowerCase());
}
function genCertId() {
  return "EX-" + Math.random().toString(16).slice(2, 10).toUpperCase();
}
function randomDevice() {
  const d = DEVICE_POOL[Math.floor(Math.random() * DEVICE_POOL.length)];
  return { ...d, id: "dev-" + Math.random().toString(36).slice(2, 8) };
}

/* Real SHA-256 via Web Crypto (no external libs needed) */
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
