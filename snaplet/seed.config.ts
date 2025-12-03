import { SeedPg } from "@snaplet/seed/adapter-pg";
import { defineConfig } from "@snaplet/seed/config";
import { Client } from "pg";

import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.resolve(__dirname, "../.env.test"),
  debug: true,
  override: true,
});

export default defineConfig({
  adapter: async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    console.log("Connecting to database...", process.env.DATABASE_URL);
    await client.connect();
    console.log("Connected to database");

    return new SeedPg(client);
  },
  select: [
    "!*",
    // We want to alter all the tables under public schema
    "public*",
    "auth.users",
    // We also want to alter some of the tables under the auth schema
  ],
});
