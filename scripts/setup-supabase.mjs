#!/usr/bin/env node
/**
 * One-shot Supabase provisioning for Ocean Empire 3D saves.
 *
 * What it does, in order:
 *   1. Finds (or creates) a Supabase project named `ocean-empire-3d`.
 *   2. Waits until the database is healthy.
 *   3. Applies supabase/migrations/0001_init.sql (idempotent).
 *   4. Enables anonymous sign-ins, which the client uses to own save rows.
 *   5. Reads the project URL and anon key.
 *   6. Optionally writes NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to a
 *      Vercel project and triggers a production redeploy from `main`.
 *
 * Required environment:
 *   SUPABASE_ACCESS_TOKEN  personal access token (supabase.com → Account → Access Tokens).
 *                          Set it to "proxy" when an outbound proxy injects the Authorization
 *                          header for api.supabase.com (e.g. a Claude cloud network secret);
 *                          the script then sends no Authorization header of its own.
 * Optional:
 *   SUPABASE_ORG_ID        organisation id; defaults to the first organisation on the token
 *   SUPABASE_REGION        default "ap-southeast-1" (Singapore)
 *   SUPABASE_DB_PASSWORD   database password for a newly created project; generated if unset
 *   VERCEL_TOKEN           when set together with VERCEL_PROJECT and VERCEL_TEAM_SLUG, the env
 *   VERCEL_PROJECT         vars are written to Vercel and a production redeploy is started
 *   VERCEL_TEAM_SLUG
 *
 * Usage:  node scripts/setup-supabase.mjs
 *
 * The script only uses the Supabase Management API and the Vercel REST API; nothing is
 * written to the repository. The anon key is public by design; the service-role key is
 * never read or stored anywhere.
 */

import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_API = "https://api.supabase.com/v1";
const PROJECT_NAME = process.env.SUPABASE_PROJECT_NAME ?? "ocean-empire-3d";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is not set. Create a personal access token at https://supabase.com/dashboard/account/tokens and export it before running this script.");
  process.exit(1);
}

async function api(method, route, body) {
  const res = await fetch(`${SUPABASE_API}${route}`, {
    method,
    headers: { ...(token === "proxy" ? {} : { Authorization: `Bearer ${token}` }), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${method} ${route} failed (${res.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findOrCreateProject() {
  const projects = await api("GET", "/projects");
  const existing = projects.find((p) => p.name === PROJECT_NAME);
  if (existing) {
    console.log(`Using existing project ${existing.name} (${existing.id}) in ${existing.region}`);
    return existing;
  }
  let orgId = process.env.SUPABASE_ORG_ID;
  if (!orgId) {
    const orgs = await api("GET", "/organizations");
    if (orgs.length === 0) throw new Error("The token has no organisations. Create one in the Supabase dashboard first.");
    orgId = orgs[0].id;
    console.log(`Using organisation ${orgs[0].name} (${orgId})`);
  }
  const dbPass = process.env.SUPABASE_DB_PASSWORD ?? randomBytes(24).toString("base64url");
  const region = process.env.SUPABASE_REGION ?? "ap-southeast-1";
  console.log(`Creating project ${PROJECT_NAME} in ${region}…`);
  const created = await api("POST", "/projects", { name: PROJECT_NAME, organization_id: orgId, db_pass: dbPass, region });
  if (!process.env.SUPABASE_DB_PASSWORD) {
    console.log("Generated database password (store it somewhere safe; it is not needed by the game):");
    console.log(`  ${dbPass}`);
  }
  return created;
}

async function waitForHealthy(ref) {
  for (let i = 0; i < 60; i++) {
    const p = await api("GET", `/projects/${ref}`);
    if (p.status === "ACTIVE_HEALTHY") return p;
    process.stdout.write(`  status ${p.status}, waiting…\r`);
    await sleep(10_000);
  }
  throw new Error("Project did not become healthy within 10 minutes.");
}

async function applyMigration(ref) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const sql = await readFile(path.join(here, "..", "supabase", "migrations", "0001_init.sql"), "utf8");
  console.log("Applying supabase/migrations/0001_init.sql…");
  // The migration is written to be re-runnable (create ... if not exists, drop trigger if exists).
  // Policies are not idempotent in SQL, so swallow "already exists" on a second run.
  try {
    await api("POST", `/projects/${ref}/database/query`, { query: sql });
  } catch (err) {
    if (!/already exists/i.test(String(err.message))) throw err;
    console.log("  Schema already present; policies left as they are.");
  }
  const check = await api("POST", `/projects/${ref}/database/query`, { query: "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'saves'" });
  if (!Array.isArray(check) || check[0]?.n !== 1) throw new Error("The saves table was not created.");
  console.log("  saves table present with row-level security.");
}

async function enableAnonymousAuth(ref) {
  console.log("Enabling anonymous sign-ins…");
  await api("PATCH", `/projects/${ref}/config/auth`, { external_anonymous_users_enabled: true });
}

async function readKeys(ref) {
  const keys = await api("GET", `/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((k) => k.name === "anon" || k.type === "legacy" && k.name === "anon") ?? keys.find((k) => /anon|publishable/i.test(k.name));
  if (!anon?.api_key) throw new Error("Could not find the anon key in the project's API keys.");
  return { url: `https://${ref}.supabase.co`, anonKey: anon.api_key };
}

async function configureVercel(url, anonKey) {
  const { VERCEL_TOKEN, VERCEL_PROJECT, VERCEL_TEAM_SLUG } = process.env;
  if (!VERCEL_TOKEN || !VERCEL_PROJECT || !VERCEL_TEAM_SLUG) {
    console.log("\nVercel variables not set (VERCEL_TOKEN, VERCEL_PROJECT, VERCEL_TEAM_SLUG); skipping Vercel configuration.");
    return;
  }
  const headers = { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" };
  const envs = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", value: url, type: "plain", target: ["production", "preview", "development"] },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: anonKey, type: "plain", target: ["production", "preview", "development"] },
  ];
  console.log(`Writing environment variables to Vercel project ${VERCEL_PROJECT}…`);
  const res = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/env?slug=${VERCEL_TEAM_SLUG}&upsert=true`, { method: "POST", headers, body: JSON.stringify(envs) });
  if (!res.ok) throw new Error(`Vercel env update failed (${res.status}): ${await res.text()}`);
  const project = await (await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT}?slug=${VERCEL_TEAM_SLUG}`, { headers })).json();
  if (project.link?.repoId) {
    console.log("Triggering a production redeploy from main…");
    const dep = await fetch(`https://api.vercel.com/v13/deployments?slug=${VERCEL_TEAM_SLUG}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: VERCEL_PROJECT, project: project.id, target: "production", gitSource: { type: "github", repoId: project.link.repoId, ref: project.link.productionBranch ?? "main" } }),
    });
    if (!dep.ok) throw new Error(`Vercel redeploy failed (${dep.status}): ${await dep.text()}`);
    const d = await dep.json();
    console.log(`  Deployment ${d.url} started.`);
  } else {
    console.log("Project is not linked to Git; run `vercel deploy --prod` to pick up the new variables.");
  }
}

const project = await findOrCreateProject();
await waitForHealthy(project.id);
await applyMigration(project.id);
await enableAnonymousAuth(project.id);
const { url, anonKey } = await readKeys(project.id);
console.log("\nSupabase is ready for Ocean Empire 3D saves:");
console.log(`  NEXT_PUBLIC_SUPABASE_URL=${url}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.slice(0, 12)}… (anon key; public by design)`);
await configureVercel(url, anonKey);
console.log("\nDone. Saves made in the browser will now also be mirrored to Supabase under an anonymous user.");
