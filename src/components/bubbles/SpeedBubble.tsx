import React from 'react';
import { Gauge, Cpu } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';

interface SpeedBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['speed'];
  lang: Language;
  bubbleSize: number;
}

export const SpeedBubble: React.FC<SpeedBubbleProps> = ({
  telemetry,
  settings,
  lang,
  bubbleSize,
}) => {
  const isKmh = settings.unit === 'km/h';
  const isMph = settings.unit === 'mph';

  // Speed conversions
  const displayedSpeed = isKmh
    ? telemetry.speedKmh
    : isMph
    ? telemetry.speedKmh * 0.621371
    : (telemetry.speedKmh * 1000) / 3600;

  const mpsSpeed = ((telemetry.speedKmh * 1000) / 3600).toFixed(1);
  const isOverSpeed = telemetry.speedKmh > settings.overspeedAlert;
  const maxScale = settings.maxDisplaySpeed || 200;
  const speedPercentage = Math.min(1, Math.max(0, displayedSpeed / maxScale));

  // Needle angle for analog gauge: from -135deg (0 km/h) to +135deg (max km/h) -> 270 deg total
  const needleDeg = -135 + speedPercentage * 270;

  // Default to gauge if style not yet defined
  const style = settings.style || 'gauge';

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = style === 'gauge' ? (bubbleSize * 0.80) / 192 : (bubbleSize * 0.80) / 170;

  // Ticks for Analog Gauge
  const tickSpeeds = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

  if (style === 'gauge') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        {/* Analog Gauge Face SVG */}
        <svg className="w-48 h-48 pointer-events-none" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="speedArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ef4444" />
            </filter>
          </defs>

          {/* Dial Background Ring Track (-135° to +135°, radius=78) */}
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="5"
            strokeDasharray="367.5"
            strokeDashoffset="122.5"
            strokeLinecap="round"
            transform="rotate(135 100 100)"
          />

          {/* Active Speed Arc */}
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke={isOverSpeed ? '#ef4444' : 'url(#speedArcGrad)'}
            strokeWidth="5.5"
            strokeDasharray="367.5"
            strokeDashoffset={367.5 - speedPercentage * 367.5 * 0.75}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            className="transition-all duration-150"
          />

          {/* Major & Minor Ticks with Numbers */}
          {tickSpeeds.map((val) => {
            const frac = val / maxScale;
            if (frac > 1.02) return null;
            const deg = -135 + frac * 270;
            const rad = (deg - 90) * (Math.PI / 180);
            const isOverspeedTick = val >= settings.overspeedAlert;

            // Tick line coordinates
            const x1 = 100 + 74 * Math.cos(rad);
            const y1 = 100 + 74 * Math.sin(rad);
            const x2 = 100 + 64 * Math.cos(rad);
            const y2 = 100 + 64 * Math.sin(rad);

            // Number coordinates
            const tx = 100 + 52 * Math.cos(rad);
            const ty = 100 + 52 * Math.sin(rad);

            return (
              <g key={val}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isOverspeedTick ? '#ef4444' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={val % 40 === 0 ? '2' : '1.2'}
                />
                {val % 40 === 0 && (
                  <text
                    x={tx}
                    y={ty + 3}
                    fill={isOverspeedTick ? '#fca5a5' : '#94a3b8'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })}

          {/* Rotating Analog Needle (指针) */}
          <g
            transform={`rotate(${needleDeg} 100 100)`}
            className="transition-transform duration-100 ease-out"
          >
            {/* Needle Body */}
            <polygon
              points="98,105 102,105 100.8,24 99.2,24"
              fill={isOverSpeed ? '#ef4444' : '#f43f5e'}
              filter="url(#needleGlow)"
            />
            {/* High-glow white needle tip */}
            <polygon points="98.8,28 101.2,28 100,20" fill="#ffffff" />
            {/* Needle Counterweight */}
            <circle cx="100" cy="108" r="4" fill="#991b1b" />
          </g>

          {/* Center Hub Outer Ring */}
          <circle cx="100" cy="100" r="28" fill="#030712" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>

        {/* Center Digital Speed Readout over Needle Hub */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`font-black font-mono leading-none tracking-tight ${
              isOverSpeed ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_#ef4444]' : 'text-white'
            }`}
            style={{ fontSize: '24px' }}
          >
            {displayedSpeed.toFixed(0)}
          </div>
          <div className="text-[9px] font-bold text-sky-400 font-mono tracking-wider mt-0.5">
            {settings.unit}
          </div>
          {settings.showMpsSubtext && (
            <div className="text-[8px] font-mono text-slate-400">
              {mpsSpeed} m/s
            </div>
          )}
        </div>

        {/* Title Tag */}
        <div className="absolute top-2 px-2 py-0.5 rounded bg-sky-950/70 border border-sky-500/40 text-[9px] font-bold text-sky-200 pointer-events-none">
          {lang === 'en' ? 'SPEED GAUGE' : lang === 'zh' ? '速度指针表' : '速度指针 gauge'}
        </div>
      </div>
    );
  }

  // Digital HUD Style
  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Title Header */}
      <div className="border border-sky-400/50 bg-sky-950/70 rounded px-2 py-0.5 mb-1 shadow-sm">
        <span className="text-[10px] font-semibold tracking-wider text-sky-200">
          {lang === 'en' ? 'SPEED HUD' : lang === 'zh' ? '速度' : '速度 speed'}
        </span>
      </div>

      {/* Main Speed Value with Circular Arc Indicator */}
      <div className="relative flex flex-col items-center justify-center my-1">
        {/* Speed Arc Gauge Background */}
        <svg
          className="w-36 h-36 pointer-events-none -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
            strokeDasharray="264"
            strokeDashoffset="60"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={isOverSpeed ? '#ef4444' : '#38bdf8'}
            strokeWidth="5"
            strokeDasharray="264"
            strokeDashoffset={264 - 204 * speedPercentage}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>

        {/* Big Speed Digits */}
        <div className="absolute flex flex-col items-center justify-center">
          <div
            className={`font-black font-mono tracking-tight drop-shadow-md leading-none ${
              isOverSpeed ? 'text-red-400 animate-pulse' : 'text-white'
            }`}
            style={{ fontSize: '38px' }}
          >
            {displayedSpeed.toFixed(0)}
          </div>
          <div className="text-[11px] font-bold text-sky-400 font-mono tracking-wider mt-0.5">
            {settings.unit}
          </div>
          {settings.showMpsSubtext && (
            <div className="text-[10px] font-mono text-slate-300/90 mt-0.5">
              {mpsSpeed} m/s
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
