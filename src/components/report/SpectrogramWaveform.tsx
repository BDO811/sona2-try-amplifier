import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface SpectrogramWaveformProps {
  score?: number; // Optional for backward compatibility
  displayText?: string; // Text to display instead of score
  statusColor: string;
  showContent: boolean;
}

export const SpectrogramWaveform = ({ score, displayText, statusColor, showContent }: SpectrogramWaveformProps) => {
  const [scanPosition, setScanPosition] = useState(0);

  // Generate heatmap-style spectrogram data (rows = frequencies, cols = time)
  const spectrogramData = useMemo(() => {
    const rows = 24; // Frequency bands
    const cols = 60; // Time slices
    const data: number[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData: number[] = [];
      for (let col = 0; col < cols; col++) {
        const x = col / cols;
        const y = row / rows;
        
        // Create formant regions (voice frequency concentrations)
        const formant1 = Math.exp(-Math.pow(y - 0.25, 2) / 0.015) * Math.sin(x * Math.PI * 6) * 0.5;
        const formant2 = Math.exp(-Math.pow(y - 0.5, 2) / 0.02) * Math.sin(x * Math.PI * 4 + 1) * 0.4;
        const formant3 = Math.exp(-Math.pow(y - 0.75, 2) / 0.018) * Math.sin(x * Math.PI * 8 + 2) * 0.3;
        
        // Base energy that fades toward edges
        const edgeFade = Math.sin(x * Math.PI) * 0.3;
        const verticalFade = Math.sin(y * Math.PI) * 0.2;
        
        // Subtle noise
        const noise = Math.sin(row * 13.7 + col * 7.3) * 0.1;
        
        const intensity = 0.1 + formant1 + formant2 + formant3 + edgeFade + verticalFade + noise;
        rowData.push(Math.min(1, Math.max(0, intensity)));
      }
      data.push(rowData);
    }
    return data;
  }, []);

  // Animate scan line
  useEffect(() => {
    if (!showContent) return;
    
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 0.2) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [showContent]);

  // Convert status color to rgb for gradient manipulation
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 16, g: 185, b: 129 };
  };

  const rgb = hexToRgb(statusColor);

  return (
    <div className="relative w-full h-36 md:h-44">
      {/* Mirrored Spectrogram Heatmap - Bottom aligned, low opacity */}
      <motion.div 
        className="absolute inset-x-0 bottom-0 h-24 md:h-28 flex flex-col justify-end opacity-25"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 0.25 : 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        {/* Upper reflection (mirrored, more faded) */}
        <div className="flex-1 flex flex-col-reverse opacity-40 blur-[1px]">
          {spectrogramData.slice(0, 12).map((row, rowIndex) => (
            <div key={`mirror-${rowIndex}`} className="flex-1 flex gap-[1px]">
              {row.map((intensity, colIndex) => {
                const isNearScan = Math.abs((colIndex / row.length) * 100 - scanPosition) < 6;
                return (
                  <div
                    key={`m-${rowIndex}-${colIndex}`}
                    className="flex-1 transition-opacity duration-150"
                    style={{
                      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * (isNearScan ? 0.6 : 0.35)})`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Main spectrogram */}
        <div className="flex-1 flex flex-col">
          {spectrogramData.map((row, rowIndex) => (
            <div key={rowIndex} className="flex-1 flex gap-[1px]">
              {row.map((intensity, colIndex) => {
                const isNearScan = Math.abs((colIndex / row.length) * 100 - scanPosition) < 6;
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="flex-1 transition-opacity duration-150"
                    style={{
                      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * (isNearScan ? 0.8 : 0.5)})`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scan Line - Subtle */}
      <motion.div
        className="absolute top-1/4 bottom-0 w-[2px] pointer-events-none opacity-40"
        style={{
          left: `${scanPosition}%`,
          background: `linear-gradient(to bottom, transparent, ${statusColor}80, ${statusColor}, ${statusColor}80, transparent)`,
        }}
        animate={{ opacity: showContent ? [0.2, 0.5, 0.2] : 0 }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Radial Lens Mask - Critical for readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 70%)`,
        }}
      />

      {/* Score Overlay with Brackets */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.9 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className="relative">
          {/* Left Bracket */}
          <span 
            className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 text-5xl md:text-6xl font-extralight font-mono"
            style={{ color: `${statusColor}40` }}
          >
            [
          </span>
          
          {/* Score or Text */}
          <motion.span
            className={`font-extralight tracking-tight font-mono ${
              displayText ? 'text-3xl md:text-4xl' : 'text-6xl md:text-7xl'
            }`}
            style={{ 
              color: statusColor,
              textShadow: `0 0 40px ${statusColor}80, 0 0 80px ${statusColor}40`,
            }}
          >
            {displayText || score}
          </motion.span>
          
          {/* Right Bracket */}
          <span 
            className="absolute -right-6 md:-right-8 top-1/2 -translate-y-1/2 text-5xl md:text-6xl font-extralight font-mono"
            style={{ color: `${statusColor}40` }}
          >
            ]
          </span>
        </div>
      </motion.div>

      {/* Subtle frequency axis labels */}
      <motion.div
        className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-3 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 0.3 : 0 }}
        transition={{ delay: 1.5 }}
      >
        <span className="font-mono text-[7px] text-white/50">4kHz</span>
        <span className="font-mono text-[7px] text-white/50">2kHz</span>
        <span className="font-mono text-[7px] text-white/50">500Hz</span>
      </motion.div>
    </div>
  );
};
