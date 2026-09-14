/**
 * Client for the Amplifier v2 group longitudinal endpoints, via the proxy.
 *
 * This is the API's own trajectory rather than the one computed locally in
 * lib/longitudinal.ts. The two answer the same question from different places:
 * the local one reads sessions saved to Firestore, this one reads the jobs the
 * API already holds, so it needs no history of our own to work.
 *
 * Every field below was taken from a live response on 2026-09-14, not from the
 * docs, because the docs pages render through shadow DOM that could not be
 * read. The shape is pinned by tests against that captured payload.
 */

const DEFAULT_URL =
  "https://us-central1-amits-playground-po.cloudfunctions.net/voiceLongitudinal";

const LONGITUDINAL_URL =
  (import.meta.env.VITE_LONGITUDINAL_URL as string | undefined) || DEFAULT_URL;

/** One recording's contribution to a signal's trajectory. */
export interface ApiDataPoint {
  recorded_at: string;
  job_id: string;
  score: number;
  level: string;
  flagged: boolean;
  /** Null on every point observed so far. Present in the schema. */
  anomaly: number | null;
}

export interface ApiTrajectory {
  resolvable: boolean;
  data_points_used: number;
  /** "insufficient_data" when the API declines to call a direction. */
  direction: string;
  slope: number | null;
}

export interface ApiLongitudinalSignal {
  name: string;
  status: string;
  baseline_score: number;
  latest_score: number;
  /**
   * Latest minus the FIRST reading, not minus the baseline. Verified against a
   * live payload: baseline 0.2126, latest 0.3728, first 0.0985, and
   * change_absolute came back 0.2742, which is latest minus first. Reading it
   * as a deviation from baseline would overstate the move by roughly 70%.
   */
  change_absolute: number;
  z_score: number;
  population_z: number;
  uncertainty: number;
  baseline_personal_weight: number;
  flagged_rate: number;
  min_data_points_met: boolean;
  trajectory: ApiTrajectory;
  data_points: ApiDataPoint[];
}

export interface ApiLongitudinal {
  /** "done", "running" while the API computes, or "empty" before any job. */
  status: string;
  computed_at?: string;
  done_job_count?: number;
  min_data_points_required?: number;
  min_data_points_met?: boolean;
  state_format_version?: number;
  signals: ApiLongitudinalSignal[];
}

/** True deviation from the personal baseline, which the payload does not carry. */
export function deviationFromBaseline(signal: ApiLongitudinalSignal): number {
  return signal.latest_score - signal.baseline_score;
}

/**
 * Registers a finished job into the caller's group.
 *
 * Fire and forget. A trajectory that is one recording behind is a smaller
 * problem than a result screen that fails because a side effect did not land.
 */
export async function registerJob(email: string, jobId: string): Promise<void> {
  if (!email || !jobId) return;
  try {
    await fetch(LONGITUDINAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, jobId }),
    });
  } catch (error) {
    console.warn("[longitudinal] could not register job", error);
  }
}

export interface FetchOptions {
  /** Restrict to these signal names. Repeatable upstream. */
  signals?: string[];
  /** ISO 8601 bounds, passed through to the API. */
  from?: string;
  to?: string;
}

/**
 * Fetches the group trajectory.
 *
 * Returns status "running" rather than polling internally, so the caller can
 * decide whether to wait. The API computes asynchronously and answered
 * "running" on the first call after a group was populated.
 */
export async function fetchApiLongitudinal(
  email: string,
  options: FetchOptions = {}
): Promise<ApiLongitudinal> {
  if (!email) return { status: "empty", signals: [] };

  const params = new URLSearchParams({ email });
  for (const s of options.signals ?? []) params.append("signal", s);
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);

  const response = await fetch(`${LONGITUDINAL_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`longitudinal fetch failed: ${response.status}`);
  }
  const payload = (await response.json()) as Partial<ApiLongitudinal>;
  return { status: payload.status || "empty", ...payload, signals: payload.signals || [] };
}
