import React from 'react';
import { Radio } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';
import { toDMS } from '../../utils/telemetry';

interface CoordsBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['coords'];
  lang: Language;
  bubbleSize: number;
}

export const CoordsBubble: React.FC<CoordsBubbleProps> = ({
  telemetry,
  settings,
  lang,
  bubbleSize,
}) => {
  const isDms = settings.format === 'dms';

  const latDisplay = isDms
    ? toDMS(telemetry.latitude, true)
    : `${telemetry.latitude.toFixed(5)}° ${telemetry.latitude >= 0 ? 'N' : 'S'}`;
  const lonDisplay = isDms
    ? toDMS(telemetry.longitude, false)
    : `${telemetry.longitude.toFixed(5)}° ${telemetry.longitude >= 0 ? 'E' : 'W'}`;

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container */}
      <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[170px]">
        {/* Header Title (matching sketch: 经纬度 latitude longitude) */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-bold text-amber-300">
            {lang === 'en' ? 'LAT / LON' : lang === 'zh' ? '经纬度' : '经纬度 coordinates'}
          </span>
        </div>

        {/* Coordinate Cards */}
        <div className="flex flex-col items-center gap-1 w-full my-0.5">
          <div
            className="w-full font-mono font-bold text-white tracking-wide bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30 shadow-inner text-center"
            style={{ fontSize: '11px' }}
          >
            {latDisplay}
          </div>
          <div
            className="w-full font-mono font-bold text-white tracking-wide bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30 shadow-inner text-center"
            style={{ fontSize: '11px' }}
          >
            {lonDisplay}
          </div>

          {/* Altitude Readout */}
          {settings.showAltitude && (
            <div className="text-[9px] font-mono text-amber-400 font-medium">
              海拔 / ALT: {telemetry.altitudeM.toFixed(1)} m
            </div>
          )}
        </div>

        {/* Satellite Count & Antenna Bar (matching sketch: 卫星数 45/60) */}
        <div className="w-full flex items-center justify-between px-1.5 py-0.5 border-t border-white/15">
          {/* Stylized Satellite Icon */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="6" height="6" rx="1" fill="rgba(217, 119, 6, 0.4)" />
              <rect x="2" y="7" width="5" height="10" rx="1" strokeWidth="1.5" />
              <line x1="2" y1="12" x2="7" y2="12" strokeWidth="1" />
              <line x1="7" y1="12" x2="9" y2="12" strokeWidth="2" />
              <rect x="17" y="7" width="5" height="10" rx="1" strokeWidth="1.5" />
              <line x1="17" y1="12" x2="22" y2="12" strokeWidth="1" />
              <line x1="15" y1="12" x2="17" y2="12" strokeWidth="2" />
              <path d="M12 9 L12 5 M9 5 C9 3 15 3 15 5" strokeWidth="1.5" />
            </svg>
            <span className="text-[9px] text-slate-300">
              {lang === 'en' ? 'GNSS' : '卫星数'}
            </span>
          </div>

          {/* Satellite Count Readout (e.g. 45/60) */}
          <div className="flex items-center gap-1 font-mono">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-[11px] text-amber-300">
              {telemetry.satellitesLocked}
            </span>
            <span className="text-[9px] text-slate-400">
              /{telemetry.satellitesTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
