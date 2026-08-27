import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { persistPgliteNow, shopFileActivated, currentDbSource } from "@/lib/db";

export type GpsFixRecord = {
  employeeId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  ticketId: string | null;
  status: string;
  distanceFt: number | null;
  at: string;
};

export type DurableState = {
  gps: Record<string, GpsFixRecord>;
  ticketPins: Record<string, { lat: number; lng: number }>;
  setupComplete: boolean;
  demoLocked: boolean;
  activationHash: string | null;
};

const EMPTY: DurableState = {
  gps: {},
  ticketPins: {},
  setupComplete: false,
  demoLocked: false,
  activationHash: null,
};

const mem = globalThis as typeof globalThis & { __fieldDurable__?: DurableState };

function localPath() {
  return path.join(process.cwd(), "data", "durable.json");
}

async function blobGet(): Promise<DurableState | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "fieldledger-db", consistency: "strong" });
    const data = await store.get("durable.json", { type: "json" });
    return (data as DurableState) ?? null;
  } catch {
    return null;
  }
}

async function blobPut(state: DurableState) {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "fieldledger-db", consistency: "strong" });
    await store.setJSON("durable.json", state);
  } catch {
    /* preview / no blobs */
  }
}

async function fileGet(): Promise<DurableState | null> {
  try {
    const raw = await readFile(localPath(), "utf8");
    return JSON.parse(raw) as DurableState;
  } catch {
    return null;
  }
}

async function filePut(state: DurableState) {
  try {
    await mkdir(path.dirname(localPath()), { recursive: true });
    await writeFile(localPath(), JSON.stringify(state), "utf8");
  } catch {
    /* read-only */
  }
}

export async function loadDurable(): Promise<DurableState> {
  if (mem.__fieldDurable__) return mem.__fieldDurable__;
  if (currentDbSource() !== "neon" && !shopFileActivated()) {
    mem.__fieldDurable__ = { ...EMPTY, gps: {}, ticketPins: {} };
    return mem.__fieldDurable__;
  }
  const fromBlob = await blobGet();
  const fromFile = fromBlob ?? (await fileGet());
  mem.__fieldDurable__ = fromFile ? { ...EMPTY, ...fromFile, gps: fromFile.gps ?? {}, ticketPins: fromFile.ticketPins ?? {} } : { ...EMPTY, gps: {}, ticketPins: {} };
  return mem.__fieldDurable__;
}

export async function saveDurable(patch: Partial<DurableState>) {
  const current = await loadDurable();
  const next: DurableState = {
    gps: patch.gps ?? current.gps,
    ticketPins: patch.ticketPins ?? current.ticketPins,
    setupComplete: patch.setupComplete ?? current.setupComplete,
    demoLocked: patch.demoLocked ?? current.demoLocked,
    activationHash: patch.activationHash === undefined ? current.activationHash : patch.activationHash,
  };
  mem.__fieldDurable__ = next;
  await blobPut(next);
  await filePut(next);
  await persistPgliteNow();
  return next;
}

export async function recordGps(fix: GpsFixRecord) {
  const current = await loadDurable();
  current.gps[fix.employeeId] = fix;
  await saveDurable({ gps: current.gps });
}

export async function recordTicketPin(ticketId: string, lat: number, lng: number) {
  const current = await loadDurable();
  current.ticketPins[ticketId] = { lat, lng };
  await saveDurable({ ticketPins: current.ticketPins });
}
