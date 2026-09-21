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

        {/* 3D Perspective Sphere Container */}
        <div
          className="relative w-30 h-30 flex items-center justify-center my-0.5 preserve-3d"
          style={{ perspective: `${settings.spherePerspective}px` }}
        >
          {/* 3D Rotating Compass Card with Standing Upright Letters */}
          <div
            className="w-28 h-28 rounded-full border-2 border-emerald-400/40 relative flex items-center justify-center transition-transform duration-100 ease-out preserve-3d"
            style={{
              transform: `rotateX(60deg) rotateZ(${-heading}deg)`,
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25), inset 0 0 16px rgba(16, 185, 129, 0.2)',
            }}
          >
            {/* Equator Circle Ring with Degree Ticks */}
            <div className="absolute inset-0 rounded-full border border-emerald-400/50 pointer-events-none" />

            {/* North 'N': Positioned on outer equator ring, same size as S, counter-rotated to stay parallel to screen */}
            <div
              className="absolute top-0 left-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-bold text-[13px] text-red-500 drop-shadow-[0_0_8px_#ef4444] tracking-wider select-none bg-slate-950/80 px-1 rounded-full border border-red-500/40">
                N
              </span>
            </div>

            {/* South 'S': Positioned on outer equator ring, same size as N, counter-rotated to stay parallel to screen */}
            <div
              className="absolute bottom-0 left-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, 50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-bold text-[13px] text-emerald-400 drop-shadow-[0_0_8px_#10b981] tracking-wider select-none bg-slate-950/80 px-1 rounded-full border border-emerald-500/40">
                S
              </span>
            </div>

            {/* East 'E': Positioned on outer equator ring, counter-rotated to stay parallel to screen */}
            <div
              className="absolute right-0 top-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-bold text-[13px] text-emerald-400 drop-shadow-[0_0_8px_#10b981] tracking-wider select-none bg-slate-950/80 px-1 rounded-full border border-emerald-500/40">
                E
              </span>
            </div>

            {/* West 'W': Positioned on outer equator ring, counter-rotated to stay parallel to screen */}
            <div
              className="absolute left-0 top-1/2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) rotateZ(${heading}deg) rotateX(-60deg)`,
                transformOrigin: 'center center',
              }}
            >
              <span className="font-mono font-bold text-[13px] text-emerald-400 drop-shadow-[0_0_8px_#10b981] tracking-wider select-none bg-slate-950/80 px-1 rounded-full border border-emerald-500/40">
                W
              </span>
            </div>

            {/* 3D Floating Double Diamond Needle (Calibrated length so it clearly points without touching or straddling the N mark) */}
            <div className="absolute w-3 h-16 flex flex-col items-center justify-center preserve-3d pointer-events-none">
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[28px] border-b-red-500 drop-shadow-[0_0_8px_#ef4444]"
                style={{ transform: 'translateZ(10px)' }}
              />
              <div
                className="w-3 h-3 rounded-full bg-slate-950 border-2 border-amber-400 z-20 shadow-md flex items-center justify-center"
                style={{ transform: 'translateZ(12px)' }}
              >
                <div className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
              </div>
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[28px] border-t-slate-300 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                style={{ transform: 'translateZ(10px)' }}
              />
            </div>
          </div>

          {/* 3D Wireframe Rings */}
          <div className="absolute inset-0 pointer-events-none rounded-full border border-emerald-400/20 flex items-center justify-center">
            <div className="w-3/5 h-full rounded-full border border-emerald-400/20" />
            <div className="absolute w-full h-3/5 rounded-full border border-emerald-400/20" />
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
