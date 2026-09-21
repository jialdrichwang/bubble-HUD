import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';

interface TiltMeterBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['tilt_meter'];
  allSettings?: BubbleSettings;
  lang: Language;
  bubbleSize: number;
  onCalibrateZero?: (pitch: number, roll: number) => void;
  onOpenCalibration?: () => void;
}

export const TiltMeterBubble: React.FC<TiltMeterBubbleProps> = ({
  telemetry,
  settings,
  allSettings,
  lang,
  bubbleSize,
  onCalibrateZero,
  onOpenCalibration,
}) => {
  // Screen orientation axis mapping & learned calibration parameters
  const orientation = allSettings?.spiritLevelOrientation || settings.screenOrientation || 'landscape';
  const rollOffset = allSettings?.spiritLevelRollOffset ?? settings.zeroOffset ?? 0;
  const gainFactor = allSettings?.spiritLevelGainFactor ?? settings.gainFactorRoll ?? 1.0;

  // Raw axis mapping based on screen orientation
  const rawRoll = orientation === 'landscape' ? telemetry.rollDeg : telemetry.pitchDeg;
  const rawPitch = orientation === 'landscape' ? telemetry.pitchDeg : telemetry.rollDeg;

  // Calibrated roll angle with learned offset and machine learning gain factor
  const currentRoll = Number(((rawRoll - rollOffset) * gainFactor).toFixed(1));
  const absRoll = Math.abs(currentRoll);

  const isWarning = absRoll >= settings.warningThreshold && absRoll < settings.dangerThreshold;
  const isDanger = absRoll >= settings.dangerThreshold;

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container */}
      <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[154px]">
        {/* Top Header (matching user sketch: 左右倾角) */}
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[10px] font-bold text-rose-300">
            {lang === 'en' ? 'ROLL TILT' : lang === 'zh' ? '左右倾角' : '左右倾角 tilt'}
          </span>
          {isDanger ? (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400 animate-pulse font-mono">
              <AlertTriangle className="w-3 h-3" /> DANGER
            </span>
          ) : isWarning ? (
            <span className="text-[9px] font-bold text-amber-400 font-mono">
              CAUTION
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-400">
              NORMAL
            </span>
          )}
        </div>

        {/* Main Dial Area */}
        <div className="relative w-36 h-24 flex items-center justify-center my-0.5">
          {/* Arc Scale & Markings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 150">
            {/* Bottom Arc Path */}
            <path
              d="M 35 110 A 75 75 0 0 0 165 110"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="4"
            />

            {/* Danger tick marks */}
            {[-45, -30, -20, -10, 0, 10, 20, 30, 45].map((deg) => {
              const rad = ((deg + 90) * Math.PI) / 180;
              const r1 = 58;
              const r2 = deg % 20 === 0 ? 72 : 66;
              const x1 = 100 + r1 * Math.cos(rad);
              const y1 = 60 + r1 * Math.sin(rad);
              const x2 = 100 + r2 * Math.cos(rad);
              const y2 = 60 + r2 * Math.sin(rad);
              const isDangerTick = Math.abs(deg) >= 30;

              return (
                <g key={deg}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDangerTick ? '#f43f5e' : '#e2e8f0'}
                    strokeWidth={deg === 0 ? '2.5' : '1.5'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center Vehicle Silhouette that tilts realistically */}
          <div
            className="relative flex flex-col items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${currentRoll}deg)` }}
          >
            <svg
              className="w-14 h-10 drop-shadow-md"
              viewBox="0 0 64 48"
              fill="none"
              stroke={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 16 L22 6 L42 6 L46 16 Z" fill="rgba(56,189,248,0.15)" />
              <rect x="8" y="16" width="48" height="18" rx="4" fill="rgba(15,23,42,0.6)" />
              <rect x="22" y="9" width="20" height="7" rx="1" strokeWidth="1.5" />
              <rect x="4" y="24" width="8" height="16" rx="2" fill="#0f172a" strokeWidth="2" />
              <rect x="52" y="24" width="8" height="16" rx="2" fill="#0f172a" strokeWidth="2" />
              <circle cx="32" cy="24" r="7" strokeWidth="2" fill="#0f172a" />
              <circle cx="32" cy="24" r="2.5" strokeWidth="1" />
            </svg>
          </div>

          {/* Indicator Needle */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-75 ease-out"
            style={{ transform: `rotate(${currentRoll}deg)` }}
          >
            <div className="absolute w-1 bg-gradient-to-b from-rose-500 to-red-600 rounded-full h-12 top-1/2 left-1/2 -translate-x-1/2 origin-top shadow-[0_0_8px_#f43f5e]">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-red-500 absolute -bottom-1 left-1/2 -translate-x-1/2" />
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-red-400 z-10" />
          </div>
        </div>

        {/* Bottom Roll Angle Readout */}
        <div className="flex items-center justify-between w-full px-2">
          <span className="text-[9px] font-mono font-bold text-rose-400">
            ◀ L
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span
              className={`font-black text-sm tracking-tight ${
                isDanger ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-white'
              }`}
            >
              {absRoll.toFixed(1)}°
            </span>
            <span className="text-[9px] text-slate-400">
              {currentRoll > 0.5 ? 'RIGHT' : currentRoll < -0.5 ? 'LEFT' : 'LEVEL'}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-rose-400">
            R ▶
          </span>
        </div>

        {/* Bottom Calibration button with Safe Elevation from Curved Edge */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {onOpenCalibration ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCalibration();
              }}
              title="学习与校准 / Calibration"
              className="no-drag text-[8.5px] text-amber-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 active:scale-95 transition-all shadow-sm"
            >
              <span>学习校准</span>
            </button>
          ) : onCalibrateZero && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCalibrateZero(rawPitch, rawRoll);
              }}
              title="校准水平归零 / Zero Calibrate"
              className="no-drag text-[8.5px] text-rose-300 hover:text-white flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>归零</span>
            </button>
          )}
          <span className="text-[8.5px] font-mono text-slate-400">
            {orientation === 'landscape' ? '横屏' : '竖屏'}
          </span>
        </div>
      </div>
    </div>
  );
};
