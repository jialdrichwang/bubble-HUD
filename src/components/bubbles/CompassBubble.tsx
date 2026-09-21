import React from 'react';
import { Compass, Satellite } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';
import { blendAnglesDeg } from '../../utils/telemetry';

interface CompassBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['compass'];
  lang: Language;
  bubbleSize: number;
}

export const CompassBubble: React.FC<CompassBubbleProps> = ({
  telemetry,
  settings,
  lang,
  bubbleSize,
}) => {
  // GPS Weighted Estimation / Fusion Mode ("指南针请增加一个GPS信息加权推算模式")
  const fusionMode = settings.fusionMode || 'auto_fusion';
  const minSpeed = settings.minSpeedKmh ?? 5.0;
  const maxWeight = settings.gpsWeightMax ?? 0.90;

  // Calculate dynamic GPS weight
  let effectiveGpsWeight = 0;
  if (fusionMode === 'gps_only') {
    effectiveGpsWeight = 1.0;
  } else if (fusionMode === 'mag_only') {
    effectiveGpsWeight = 0;
  } else {
    // auto_fusion: ramp from 0 at minSpeed to maxWeight at minSpeed + 25 km/h
    if (telemetry.speedKmh <= minSpeed) {
      effectiveGpsWeight = 0;
    } else {
      const ramp = Math.min(1, (telemetry.speedKmh - minSpeed) / 25);
      effectiveGpsWeight = ramp * maxWeight;
    }
  }

  const rawMag = telemetry.magneticHeadingDeg ?? telemetry.headingDeg;
  const rawGps = telemetry.gpsBearingDeg ?? telemetry.headingDeg;
  const heading =
    fusionMode === 'auto_fusion'
      ? blendAnglesDeg(rawMag, rawGps, effectiveGpsWeight)
      : fusionMode === 'gps_only'
      ? rawGps
      : rawMag;

  // Cardinal direction label
  const getCardinal = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  const cardinal = getCardinal(heading);

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container */}
      <div className="flex flex-col items-center justify-center gap-0.5 w-full max-w-[148px]">
        {/* Top Header with Safe Edge Inset */}
        <div className="flex items-center justify-between w-full px-2 pt-1">
          <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
            <Compass className="w-3 h-3 text-emerald-400 animate-spin-slow" />
            <span>{lang === 'en' ? '3D COMPASS' : lang === 'zh' ? '3D指南针' : '3D compass'}</span>
          </span>
          <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold text-[11px]">
            <span>{Math.round(heading).toString().padStart(3, '0')}°</span>
            <span className="text-white bg-emerald-700/70 px-1 rounded text-[9px] shadow-sm">{cardinal}</span>
          </div>
        </div>

        {/* GPS Information Weighted Fusion Badge */}
        <div className="flex items-center justify-center w-full px-1">
          {fusionMode === 'auto_fusion' ? (
            effectiveGpsWeight > 0.05 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-medium bg-sky-950/80 text-sky-300 border border-sky-500/40 shadow-xs">
                <Satellite className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                <span>GPS加权推算 {Math.round(effectiveGpsWeight * 100)}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-medium bg-slate-900/80 text-emerald-300 border border-emerald-500/30 shadow-xs">
                <span>🧭 地磁基准 (静止待机)</span>
              </span>
            )
          ) : fusionMode === 'gps_only' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-medium bg-sky-950/80 text-sky-200 border border-sky-400/40 shadow-xs">
              <Satellite className="w-2.5 h-2.5 text-sky-400" />
              <span>纯GPS卫星航迹 (COG)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-medium bg-slate-900/80 text-emerald-300 border border-emerald-500/30 shadow-xs">
              <span>🧭 纯电子磁力计</span>
            </span>
          )}
        </div>

        {/* 3D Perspective Sphere & Earth Container */}
        <div
          className="relative w-32 h-32 flex items-center justify-center my-0.5 preserve-3d"
          style={{ perspective: `${settings.spherePerspective}px` }}
        >
          {/* CRISP 3D SPHERICAL COORDINATE GRID (用户需求：不用加地球图片，只用把地球的原有的网格线清淅一点，加了地球影响读取) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <defs>
                <clipPath id="sphereWireframeClip">
                  <circle cx="50" cy="50" r="46" />
                </clipPath>
              </defs>

              {/* Pure Transparent Subtle Sphere Shell */}
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="rgba(2, 6, 23, 0.25)"
                stroke="rgba(16, 185, 129, 0.45)"
                strokeWidth="1.2"
              />

              {/* Crisp, Clear Latitude & Longitude Coordinate Wireframe Grid Lines */}
              <g clipPath="url(#sphereWireframeClip)">
                {/* Latitudinal Parallels (Equator, Tropics, High-latitude Parallels) - Crisp & Distinct */}
                <line x1="4" y1="50" x2="96" y2="50" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.85" />
                <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#34d399" strokeWidth="1" strokeOpacity="0.75" />
                <ellipse cx="50" cy="50" rx="46" ry="32" fill="none" stroke="#6ee7b7" strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="3 2" />

                {/* Longitudinal Meridians (Prime meridian & Great Circles) - Crisp & Distinct */}
                <line x1="50" y1="4" x2="50" y2="96" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.85" />
                <ellipse cx="50" cy="50" rx="16" ry="46" fill="none" stroke="#34d399" strokeWidth="1" strokeOpacity="0.75" />
                <ellipse cx="50" cy="50" rx="32" ry="46" fill="none" stroke="#6ee7b7" strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="3 2" />

                {/* Center Equator Anchor Ticks */}
                <circle cx="50" cy="50" r="2" fill="#34d399" />
              </g>

              {/* Delicate Outer Rim */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            </svg>
          </div>

          {/* 3D Rotating Compass Card with Standing Upright Letters (No letter glow, No outer letter rings) */}
          <div
            className="w-28 h-28 rounded-full border border-emerald-400/50 relative flex items-center justify-center transition-transform duration-100 ease-out preserve-3d"
            style={{
              transform: `rotateX(60deg) rotateZ(${-heading}deg)`,
            }}
          >
            {/* North 'N': Positioned on dial, clean solid red, NO letter glow, NO letter outer ring */}
            <div
              className="absolute top-0 left-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-black text-sm text-red-500 tracking-wider select-none leading-none">
                N
              </span>
            </div>

            {/* South 'S': Positioned on dial, clean solid emerald, NO letter glow, NO letter outer ring */}
            <div
              className="absolute bottom-0 left-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, 50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-black text-sm text-emerald-400 tracking-wider select-none leading-none">
                S
              </span>
            </div>

            {/* East 'E': Positioned on dial, clean solid emerald, NO letter glow, NO letter outer ring */}
            <div
              className="absolute right-0 top-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-black text-sm text-emerald-400 tracking-wider select-none leading-none">
                E
              </span>
            </div>

            {/* West 'W': Positioned on dial, clean solid emerald, NO letter glow, NO letter outer ring */}
            <div
              className="absolute left-0 top-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-black text-sm text-emerald-400 tracking-wider select-none leading-none">
                W
              </span>
            </div>

            {/* 3D Floating Double Diamond Needle (Calibrated length pointing precisely) */}
            <div className="absolute w-3 h-16 flex flex-col items-center justify-center preserve-3d pointer-events-none">
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[28px] border-b-red-500 drop-shadow-md"
                style={{ transform: 'translateZ(10px)' }}
              />
              <div
                className="w-3 h-3 rounded-full bg-slate-950 border-2 border-amber-400 z-20 shadow-md flex items-center justify-center"
                style={{ transform: 'translateZ(12px)' }}
              >
                <div className="w-1 h-1 rounded-full bg-amber-400" />
              </div>
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[28px] border-t-slate-300 drop-shadow-sm"
                style={{ transform: 'translateZ(10px)' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Subtext with Safe Inset for NAV and Bearing */}
        <div className="w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/90 px-3 pt-1 pb-0.5 mb-1 border-t border-white/15">
          <span className="text-slate-300 font-sans font-medium">{lang === 'en' ? 'NAV' : '航向'}</span>
          <span>BEARING: {heading.toFixed(1)}°</span>
          <span className="text-emerald-300 font-bold">{cardinal}</span>
        </div>
      </div>
    </div>
  );
};
