import type { RunRecord } from "../../../shared/types";
const STORAGE_KEY = "neon-survivor.records.v1";
function isRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as RunRecord;
  return (
    typeof r.id === "string" &&
    ["duration", "wave", "level", "kills", "damage"].every(
      (k) =>
        typeof r[k as keyof RunRecord] === "number" &&
        Number.isFinite(r[k as keyof RunRecord]),
    ) &&
    Array.isArray(r.weapons) &&
    r.weapons.every((w) => typeof w === "string") &&
    typeof r.victory === "boolean"
  );
}
/** v1 时代的档案没有模式字段，统一补视为单人，避免旧存档被过滤。 */
function normalize(r: RunRecord): RunRecord {
  return { ...r, mode: r.mode === "coop" ? "coop" : "solo" };
}
export function loadRecords(): RunRecord[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter(isRecord).slice(0, 20).map(normalize)
      : [];
  } catch {
    return [];
  }
}
export function saveRecords(records: RunRecord[]): void {
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, 20)),
      );
  } catch {
    /* A full or disabled store cannot interrupt a run. */
  }
}
