import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { ExtendedMetric, LabMetric, SignalSummary } from "@/lib/result-types";
import {
  bandColor,
  bandColorForSignal,
  bandForSignal,
  bandLabelForSignal,
  bandScaleOptions,
  signLabel,
} from "@/lib/signal-band";
import { readableSubDimensions } from "@/lib/sub-dimensions";
import {
  BODY_ZONE_LABEL,
  BODY_ZONES,
  type BodyZone,
  zoneForLabMetric,
  zoneForSignal,
  zoneForSubDimension,
} from "@/lib/body-zone-map";
import { OptionScale, type ScaleOption } from "./OptionScale";
import bodyFull from "@/assets/bodymap/body-full.png";
import bodyFullFemale from "@/assets/bodymap/body-full-female.jpg";
import iconBrain from "@/assets/bodymap/icon-brain.png";
import iconMouth from "@/assets/bodymap/icon-mouth.png";
import iconHeart from "@/assets/bodymap/icon-heart.png";
import iconLungs from "@/assets/bodymap/icon-lungs.png";
import iconBlood from "@/assets/bodymap/icon-blood.png";

interface BodyMapPanelProps {
  signals: SignalSummary[];
  extendedMetrics: ExtendedMetric[] | undefined;
  labMetrics: LabMetric[];
  showContent: boolean;
  isHighVis?: boolean;
  isSeniorMode?: boolean;
  /** Picks the body graphic. Undefined (declined/skipped) falls back to the male graphic. */
  biologicalSex?: "male" | "female";
}

const ZONE_ICON: Record<BodyZone, string> = {
  brain: iconBrain,
  mouth: iconMouth,
  heart: iconHeart,
  lungs: iconLungs,
  blood: iconBlood,
};

/** Position of each zone's marker on the body graphic, as a fraction of its box. */
const ZONE_MARKER_POSITION: Record<BodyZone, { left: string; top: string }> = {
  brain: { left: "50%", top: "9.5%" },
  mouth: { left: "50%", top: "19.5%" },
  heart: { left: "42%", top: "28.6%" },
  lungs: { left: "58%", top: "28.6%" },
  blood: { left: "50%", top: "40.5%" },
};

/**
 * Mirrors SubDimensionPanel's DIRECTION_COLORS (unfavourable, middle,
 * favourable at indices 0/1/2 there; this scale is drawn favourable-left to
 * match every other scale on the report, so the order here is reversed).
 */
const SUBDIM_SCALE_COLOR: Array<{ dark: string; light: string }> = [
  { dark: "#FF6173", light: "#8E1220" }, // unfavourable
  { dark: "#4CAF6E", light: "#1E5631" }, // middle
  { dark: "#99E4FF", light: "#12657F" }, // favourable
];

interface SignalRow {
  kind: "signal";
  key: string;
  label: string;
  bandWord: string;
  scale: ScaleOption[];
  activeKey: string | null;
  isAbnormal: boolean;
}

interface SubDimRow {
  kind: "subdim";
  key: string;
  label: string;
  scoreMean: number;
  scoreStd: number;
  scale: ScaleOption[];
  activeKey: string;
  isAbnormal: boolean;
}

interface LabRow {
  kind: "lab";
  key: string;
  label: string;
  value: string;
  unit: string;
  reference: string;
  isAbnormal: boolean;
}

type ZoneRow = SignalRow | SubDimRow | LabRow;

interface ZoneGroup {
  zone: BodyZone;
  hasAbnormal: boolean;
  hasData: boolean;
  signalRows: SignalRow[];
  subDimRows: SubDimRow[];
  labRows: LabRow[];
}

function buildZoneGroups(
  signals: SignalSummary[],
  extendedMetrics: ExtendedMetric[] | undefined,
  labMetrics: LabMetric[]
): Record<BodyZone, ZoneGroup> {
  const groups = Object.fromEntries(
    BODY_ZONES.map((zone) => [
      zone,
      { zone, hasAbnormal: false, hasData: false, signalRows: [], subDimRows: [], labRows: [] },
    ])
  ) as Record<BodyZone, ZoneGroup>;

  for (const sig of signals) {
    const band = bandForSignal(sig.name, sig.level);
    if (band === "INCONCLUSIVE") continue;
    const zone = zoneForSignal(sig.name);
    /*
      Not a raw isFlaggedBand check: fatigue/stress/anxiety display LOW in the
      same green as NORMAL (GREEN_THROUGH_LOW in signal-band.ts — "a faint
      indicator here is not something to act on"), so flashing them at LOW
      would blink a row the app itself is showing as fine. Comparing the row's
      actual displayed colour against NORMAL's is what the rest of the report
      already uses to decide this, so it is reused here rather than
      re-deriving the same exception.
    */
    const isAbnormal = bandColorForSignal(sig.name, band, "dark") !== bandColor("NORMAL", "dark");
    groups[zone].signalRows.push({
      kind: "signal",
      key: `signal-${sig.name}`,
      label: signLabel(sig.name, sig.label),
      bandWord: bandLabelForSignal(sig.name, band),
      scale: bandScaleOptions(sig.name),
      activeKey: band,
      isAbnormal,
    });
    groups[zone].hasData = true;
    if (isAbnormal) groups[zone].hasAbnormal = true;
  }

  for (const row of readableSubDimensions(extendedMetrics)) {
    const zone = zoneForSubDimension();
    const isAbnormal = !row.neutral && row.bandIndex === 2;
    const scale: ScaleOption[] = row.levels
      .map((label, i) => ({
        key: String(i),
        label,
        color: SUBDIM_SCALE_COLOR[i].dark,
        colorLight: SUBDIM_SCALE_COLOR[i].light,
      }))
      .reverse();
    groups[zone].subDimRows.push({
      kind: "subdim",
      key: `subdim-${row.id}`,
      label: row.label,
      scoreMean: row.scoreMean,
      scoreStd: row.scoreStd,
      scale,
      activeKey: String(row.bandIndex),
      isAbnormal,
    });
    groups[zone].hasData = true;
    if (isAbnormal) groups[zone].hasAbnormal = true;
  }

  for (const metric of labMetrics) {
    const zone = zoneForLabMetric(metric.label);
    const isAbnormal = metric.status !== "normal";
    groups[zone].labRows.push({
      kind: "lab",
      key: `lab-${metric.label}`,
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
      reference: metric.reference,
      isAbnormal,
    });
    groups[zone].hasData = true;
    if (isAbnormal) groups[zone].hasAbnormal = true;
  }

  return groups;
}

interface Line {
  /** Row key, unique across every zone - see SignalRow/SubDimRow/LabRow. */
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  abnormal: boolean;
}

/**
 * Groups every real measurement Sona-2 reports (signals, sub-dimensions, lab
 * metrics) under the body-part icon it reads on.
 *
 * Two layouts share the same zone data:
 * - Below `lg`, the body graphic sits above a single stacked column of zone
 *   sections — the report chassis is a fixed max-w-[500px] there, with no
 *   room to split body and measurements side by side.
 * - At `lg` and up, HealthProfile widens the chassis and this renders the
 *   body graphic (vertically centered against the right column, which is
 *   usually taller) on the left, the same zone sections on the right, and a
 *   thin dotted line from each zone's marker to every one of its rows -
 *   measured live via getBoundingClientRect, since row counts and heights
 *   vary per result and aren't knowable in advance. Only the marker glows;
 *   the rows and the zone-header dot stay static so one flagged zone doesn't
 *   read as several separate things all insisting on attention at once.
 */
export const BodyMapPanel = ({
  signals,
  extendedMetrics,
  labMetrics,
  showContent,
  isHighVis = false,
  isSeniorMode = false,
  biologicalSex,
}: BodyMapPanelProps) => {
  const groups = buildZoneGroups(signals, extendedMetrics, labMetrics);
  const zonesWithData = BODY_ZONES.filter((z) => groups[z].hasData);
  const rowsByZone: Partial<Record<BodyZone, ZoneRow[]>> = {};
  for (const zone of zonesWithData) {
    const g = groups[zone];
    rowsByZone[zone] = [...g.signalRows, ...g.subDimRows, ...g.labRows];
  }

  const bodyImage = biologicalSex === "female" ? bodyFullFemale : bodyFull;

  const desktopRootRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Partial<Record<BodyZone, HTMLSpanElement>>>({});
  const rowRefs = useRef<Record<string, HTMLDivElement>>({});
  const [lines, setLines] = useState<Line[]>([]);

  // One line per row, not per zone: a zone's marker is a single point, but the
  // zone can carry many rows (brain alone runs ten sub-dimensions), so every
  // row gets its own thin line back to the marker that produced it.
  const measureLines = () => {
    const root = desktopRootRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const next: Line[] = [];
    for (const zone of zonesWithData) {
      const marker = markerRefs.current[zone];
      if (!marker) continue;
      const markerBox = marker.getBoundingClientRect();
      const x1 = markerBox.left + markerBox.width / 2 - rootBox.left;
      const y1 = markerBox.top + markerBox.height / 2 - rootBox.top;
      for (const row of rowsByZone[zone] ?? []) {
        const rowEl = rowRefs.current[row.key];
        if (!rowEl) continue;
        const rowBox = rowEl.getBoundingClientRect();
        next.push({
          key: row.key,
          x1,
          y1,
          x2: rowBox.left - rootBox.left,
          y2: rowBox.top + rowBox.height / 2 - rootBox.top,
          abnormal: row.isAbnormal,
        });
      }
    }
    setLines(next);
  };

  // Re-measure on layout changes: the figure image loads asynchronously (its
  // box only reaches final size once decoded) and zone row counts vary per
  // result, so a one-time measurement on mount would miss both.
  useLayoutEffect(() => {
    measureLines();
    const root = desktopRootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measureLines());
    observer.observe(root);
    window.addEventListener("resize", measureLines);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureLines);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesWithData.join(","), showContent, biologicalSex]);

  if (zonesWithData.length === 0) return null;

  const labelSize = isSeniorMode
    ? "text-sm font-semibold text-white"
    : isHighVis
      ? "text-[11px] font-medium text-white"
      : "text-[10px] font-medium text-white";
  const zoneNameSize = isSeniorMode ? "text-sm" : isHighVis ? "text-[11px]" : "text-[10px]";

  /*
    `blink` is on for the stacked mobile layout (the row itself is the only
    thing that can show a flag) and off for the desktop split layout, where
    the body marker is already the thing that glows - blinking the finding
    too reads as two separate things both insisting on attention instead of
    one marker pointing at one plain readout.
  */
  const renderRows = (rows: ZoneRow[], blink: boolean, getRowRef?: (key: string) => (el: HTMLDivElement | null) => void) =>
    rows.map((row) => {
      if (row.kind === "lab") {
        return (
          <div
            key={row.key}
            ref={getRowRef?.(row.key)}
            className={`bg-black/85 flex items-baseline gap-2 ${
              isSeniorMode ? "px-4 py-3" : isHighVis ? "px-3.5 py-2.5" : "px-3 py-2"
            } ${row.isAbnormal && blink ? "animate-gentle-blink" : ""}`}
          >
            <span className={`font-mono uppercase tracking-wider ${labelSize}`}>{row.label}</span>
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: row.isAbnormal ? "#FFC163" : "#4CAF6E" }}
            >
              {row.value}
            </span>
            <span className="font-mono text-[9px] text-white/50">{row.unit}</span>
            <span className="font-mono text-[8px] text-white/35 ml-auto">{row.reference}</span>
          </div>
        );
      }

      const scoreText =
        row.kind === "subdim" ? (
          <span className="font-mono tabular-nums text-white/70 text-[9px] flex-shrink-0">
            {row.scoreMean.toFixed(2)}
            <span className="text-white/50"> &plusmn;{row.scoreStd.toFixed(2)}</span>
          </span>
        ) : null;

      return (
        <div
          key={row.key}
          ref={getRowRef?.(row.key)}
          className={`bg-black/85 ${
            isSeniorMode ? "px-4 py-4" : isHighVis ? "px-3.5 py-3" : "px-3 py-2.5"
          } ${row.isAbnormal && blink ? "animate-gentle-blink" : ""}`}
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className={`font-mono uppercase tracking-wider truncate ${labelSize}`}>{row.label}</span>
            {row.kind === "signal" ? (
              <span
                className={`font-mono flex-shrink-0 ${isSeniorMode ? "text-xs" : "text-[10px]"}`}
                style={{ color: "#99E4FF" }}
              >
                {row.bandWord}
              </span>
            ) : (
              scoreText
            )}
          </div>
          <OptionScale
            options={row.scale}
            activeKey={row.activeKey}
            ariaLabel={`${row.label}: ${row.kind === "signal" ? row.bandWord : ""}`}
            {...(row.kind === "subdim" ? { dimOpacity: 0.8 } : {})}
          />
        </div>
      );
    });

  return (
    <div>
      {/* Below lg: body graphic above a single stacked column, unchanged. */}
      <div className="lg:hidden">
        <div
          className="relative mx-auto mb-3 rounded-lg overflow-hidden"
          style={{ backgroundColor: "#0B0B0A", maxWidth: 220 }}
        >
          <img src={bodyImage} alt="" className="w-full h-auto block" />
          {zonesWithData.map((zone) => {
            const g = groups[zone];
            const pos = ZONE_MARKER_POSITION[zone];
            return (
              <span
                key={zone}
                className={`absolute rounded-full ${g.hasAbnormal ? "animate-gentle-blink" : ""}`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: 9,
                  height: 9,
                  transform: "translate(-50%, -50%)",
                  background: g.hasAbnormal ? "#FF6173" : "rgba(222,255,230,0.9)",
                  boxShadow: g.hasAbnormal
                    ? "0 0 10px 3px rgba(255,97,115,0.6)"
                    : "0 0 8px 3px rgba(222,255,230,0.4)",
                }}
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {zonesWithData.map((zone, zoneIndex) => {
            const g = groups[zone];
            const rows: ZoneRow[] = [...g.signalRows, ...g.subDimRows, ...g.labRows];
            return (
              <motion.div
                key={zone}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 8 }}
                transition={{ delay: 1.15 + zoneIndex * 0.08, duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={ZONE_ICON[zone]} alt="" className="w-6 h-6 opacity-90" />
                  <span className={`font-mono uppercase tracking-widest ${zoneNameSize} text-[#231200]`}>
                    {BODY_ZONE_LABEL[zone]}
                  </span>
                  {g.hasAbnormal && (
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-gentle-blink"
                      style={{ background: "#FF6173" }}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-px bg-[#231200]/15 rounded-lg overflow-hidden">
                  {renderRows(rows, true)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* lg and up: body graphic on the left, dotted connector lines to the
          same zone sections laid out on the right. */}
      <div className="hidden lg:block relative" ref={desktopRootRef}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
          {lines.map((line) => (
            <g key={line.key}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.abnormal ? "#FF6173" : "rgba(35,18,0,0.25)"}
                strokeWidth={1}
                strokeDasharray="1.5 4"
                strokeLinecap="round"
                className={line.abnormal ? "animate-bodymap-line-breathe" : undefined}
              />
              <circle
                cx={line.x2}
                cy={line.y2}
                r={2.5}
                fill={line.abnormal ? "#FF6173" : "rgba(35,18,0,0.25)"}
                className={line.abnormal ? "animate-bodymap-line-breathe" : undefined}
              />
            </g>
          ))}
        </svg>

        <div className="flex gap-10" style={{ position: "relative", zIndex: 2 }}>
          {/* self-center: vertically centered against the full height of the
              right column, which is usually much taller than the figure - a
              zone-heavy result (e.g. brain's ten sub-dimensions) stretches the
              right column well past the figure's own height. */}
          <div
            className="relative rounded-lg overflow-hidden flex-shrink-0 self-center"
            style={{ backgroundColor: "#0B0B0A", width: 220 }}
          >
            <img src={bodyImage} alt="" className="w-full h-auto block" onLoad={measureLines} />
            {zonesWithData.map((zone) => {
              const g = groups[zone];
              const pos = ZONE_MARKER_POSITION[zone];
              return (
                <span
                  key={zone}
                  ref={(el) => {
                    if (el) markerRefs.current[zone] = el;
                  }}
                  className="absolute rounded-full"
                  style={
                    {
                      left: pos.left,
                      top: pos.top,
                      width: 11,
                      height: 11,
                      transform: "translate(-50%, -50%)",
                      background: g.hasAbnormal ? "#FF6173" : "rgba(222,255,230,0.9)",
                      boxShadow: g.hasAbnormal
                        ? "0 0 10px 4px rgba(255,97,115,0.55)"
                        : "0 0 8px 3px rgba(222,255,230,0.4)",
                      "--bodymap-glow-color": "rgba(255,97,115,0.55)",
                    } as CSSProperties
                  }
                >
                  {g.hasAbnormal && (
                    <span
                      className="absolute rounded-full animate-bodymap-marker-ring"
                      style={{ inset: -7, border: "1px solid #FF6173" }}
                    />
                  )}
                  {g.hasAbnormal && <span className="absolute inset-0 rounded-full animate-bodymap-marker-glow" />}
                </span>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {zonesWithData.map((zone, zoneIndex) => {
              const g = groups[zone];
              const rows: ZoneRow[] = [...g.signalRows, ...g.subDimRows, ...g.labRows];
              return (
                <motion.div
                  key={zone}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 8 }}
                  transition={{ delay: 1.15 + zoneIndex * 0.08, duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <img src={ZONE_ICON[zone]} alt="" className="w-6 h-6 opacity-90" />
                    <span className={`font-mono uppercase tracking-widest ${zoneNameSize} text-[#231200]`}>
                      {BODY_ZONE_LABEL[zone]}
                    </span>
                    {/* Static, not blinking: the marker on the figure is the
                        one thing in this layout that glows. */}
                    {g.hasAbnormal && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6173" }} />
                    )}
                  </div>

                  <div className="flex flex-col gap-px bg-[#231200]/15 rounded-lg overflow-hidden">
                    {renderRows(rows, false, (key) => (el) => {
                      if (el) rowRefs.current[key] = el;
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMapPanel;
