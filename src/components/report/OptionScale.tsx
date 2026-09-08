/**
 * A scale of every possible outcome, with the one a result landed on lit and
 * the ones it did not at half opacity.
 *
 * Used twice on the results screen: once at the top for the four assessment
 * rungs, once per signal row for the five severity bands. Position is fixed and
 * identical every time, so where a result sits is read in place rather than by
 * comparing bar lengths between rows — which is what the single-word-plus-bar
 * treatment could not do.
 *
 * The breathing highlight lives in index.css as .animate-scale-breathe, driven
 * by the custom properties set below.
 */

export interface ScaleOption {
  key: string;
  label: string;
  /** Hex, so the tints below can be derived from it. */
  color: string;
}

interface OptionScaleProps {
  options: ScaleOption[];
  /** The option to light. Null lights nothing, for an unreadable result. */
  activeKey: string | null;
  /** "lg" for the assessment scale at the top, "sm" for a signal row. */
  size?: "sm" | "lg";
  ariaLabel: string;
}

/** Half opacity for the options a result is not. */
const DIM = 0.5;

function tint(hex: string, alpha: number): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return "transparent";
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(match[i], 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const OptionScale = ({
  options,
  activeKey,
  size = "sm",
  ariaLabel,
}: OptionScaleProps) => {
  const isLarge = size === "lg";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = option.key === activeKey;
        return (
          <span
            key={option.key}
            aria-current={isActive ? "true" : undefined}
            className={`text-center font-mono uppercase whitespace-nowrap rounded ${
              isLarge
                ? "text-[11px] md:text-[13px] tracking-[0.1em] py-2 px-1"
                : "text-[8px] md:text-[9px] tracking-[0.06em] py-1 px-0.5"
            } ${isActive ? "animate-scale-breathe" : ""}`}
            style={{
              color: option.color,
              opacity: isActive ? 1 : DIM,
              // Read by the keyframes; harmless on the dimmed options.
              ["--scale-color" as string]: option.color,
              ["--scale-tint-lo" as string]: tint(option.color, 0.1),
              ["--scale-tint-hi" as string]: tint(option.color, isLarge ? 0.24 : 0.2),
              ["--scale-glow" as string]: isLarge ? "14px" : "9px",
            }}
          >
            {option.label}
          </span>
        );
      })}
    </div>
  );
};

export default OptionScale;
