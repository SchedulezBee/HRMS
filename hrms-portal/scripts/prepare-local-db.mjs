import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const envPath = path.resolve(process.cwd(), ".env");

function updateEnvContent(currentContent, values) {
  const lines = currentContent.split(/\r?\n/);
  const nextLines = [];
  const seen = new Set();

  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=/);

    if (!match) {
      nextLines.push(line);
      continue;
    }

    const key = match[1];

    if (key in values) {
      nextLines.push(`${key}="${values[key]}"`);
      seen.add(key);
      continue;
    }

    nextLines.push(line);
  }

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}="${value}"`);
    }
  }

  return `${nextLines.filter(Boolean).join("\n")}\n`;
}

async function ensureDatabase(client, databaseName) {
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Created database ${databaseName}.`);
    return;
  }

  console.log(`Database ${databaseName} already exists.`);
}

const directDatabaseUrl =
  process.env.DIRECT_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/hrms_portal?schema=public&sslmode=disable";
const shadowDatabaseUrl =
  process.env.SHADOW_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/hrms_portal_shadow?schema=public&sslmode=disable";
const runtimeDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/hrms_portal?schema=public&sslmode=disable";

const adminClient = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable",
});

try {
  await adminClient.connect();
  await ensureDatabase(adminClient, "hrms_portal");
  await ensureDatabase(adminClient, "hrms_portal_shadow");
} finally {
  await adminClient.end();
}

const existingEnv = await fs.readFile(envPath, "utf8").catch(() => "");
const nextEnv = updateEnvContent(existingEnv, {
  DATABASE_URL: runtimeDatabaseUrl,
  DIRECT_DATABASE_URL: directDatabaseUrl,
  SHADOW_DATABASE_URL: shadowDatabaseUrl,
});

await fs.writeFile(envPath, nextEnv, "utf8");

console.log("Local PostgreSQL development databases are ready.");
