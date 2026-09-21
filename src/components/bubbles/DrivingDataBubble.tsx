import React from 'react';
import { RotateCcw, Clock, Navigation, MapPin } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';
import { formatDuration } from '../../utils/telemetry';

interface DrivingDataBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['driving_data'];
  lang: Language;
  bubbleSize: number;
  onResetTrip?: () => void;
}

export const DrivingDataBubble: React.FC<DrivingDataBubbleProps> = ({
  telemetry,
  settings,
  lang,
  bubbleSize,
  onResetTrip,
}) => {
  const isKm = settings.distanceUnit === 'km';
  const dist = isKm ? telemetry.tripDistanceKm : telemetry.tripDistanceKm * 0.621371;
  const directDist = isKm ? telemetry.tripDirectDistanceKm : telemetry.tripDirectDistanceKm * 0.621371;
  const unitStr = isKm ? 'km' : 'mi';

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
        {/* Header (matching sketch: 行驶数据 driving data) */}
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-cyan-300">
            {lang === 'en' ? 'TRIP DATA' : lang === 'zh' ? '行驶数据' : '行驶数据 trip'}
          </span>
          {onResetTrip && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetTrip();
              }}
              title="重置里程数据 / Reset Trip"
              className="no-drag text-[9px] text-cyan-400 hover:text-white flex items-center gap-0.5 px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>重置</span>
            </button>
          )}
        </div>

        {/* Main Stats Rows */}
        <div className="w-full flex flex-col gap-1 px-1 my-0.5">
          {/* Row 1: Driving Time */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-0.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{lang === 'en' ? 'Driving Time' : '行驶时间'}</span>
            </div>
            <span className="font-mono font-bold text-white text-[11px] tracking-wide">
              {formatDuration(telemetry.tripDurationSec)}
            </span>
          </div>

          {/* Row 2: Driving Distance */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-0.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <Navigation className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{lang === 'en' ? 'Trip Dist' : '行驶距离'}</span>
            </div>
            <div className="font-mono">
              <span className="font-bold text-cyan-300 text-[12px]">{dist.toFixed(1)}</span>
              <span className="text-[9px] text-slate-400 ml-0.5">{unitStr}</span>
            </div>
          </div>

          {/* Row 3: Straight-line Distance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{lang === 'en' ? 'Direct Dist' : '直线距离'}</span>
            </div>
            <div className="font-mono">
              <span className="font-bold text-cyan-200 text-[11px]">{directDist.toFixed(1)}</span>
              <span className="text-[9px] text-slate-400 ml-0.5">{unitStr}</span>
            </div>
          </div>
        </div>

        {/* Footer: Avg Speed */}
        <div className="w-full flex items-center justify-between px-1 pt-1 border-t border-white/15 text-[9px] font-mono text-slate-400">
          <span>均速 / AVG:</span>
          <span className="text-cyan-300 font-bold">{telemetry.avgSpeedKmh.toFixed(1)} {settings.speedUnit}</span>
        </div>
      </div>
    </div>
  );
};
