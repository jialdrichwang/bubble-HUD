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

  // Swapping and Inversion Flags (顶部滑动菜单设置)
  const isSwapped = allSettings?.swapSpiritAndTiltParams ?? false;
  const invertRoll = allSettings?.tiltMeterInvertRoll ?? false;

  // Raw axis mapping based on screen orientation and parameter swapping
  let baseRoll = orientation === 'landscape' ? telemetry.rollDeg : telemetry.pitchDeg;
  let basePitch = orientation === 'landscape' ? telemetry.pitchDeg : telemetry.rollDeg;

  if (isSwapped) {
    const temp = baseRoll;
    baseRoll = basePitch;
    basePitch = temp;
  }

  const rawRoll = invertRoll ? -baseRoll : baseRoll;
  const rawPitch = basePitch;

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
      className="w-full h-full relative flex flex-col items-center justify-between text-center select-none py-1.5"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Container: Top header, Vehicle in upper center, Scale Dial locked to bottom */}
      <div className="flex flex-col items-center justify-between w-full h-full max-w-[158px]">
        {/* Top Header (左右倾角 / Status) */}
        <div className="flex items-center justify-between w-full px-1.5 pt-0.5 shrink-0">
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

        {/* Center Vehicle Body (Upper center, tilting smoothly) */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          <div
            className="relative flex flex-col items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${currentRoll}deg)` }}
          >
            <svg
              className="w-16 h-11 drop-shadow-md"
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

          {/* Roll Angle Readout in middle */}
          <div className="flex items-baseline gap-1 font-mono mt-0.5">
            <span
              className={`font-black text-base tracking-tight ${
                isDanger ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-white'
              }`}
            >
              {absRoll.toFixed(1)}°
            </span>
            <span className="text-[9.5px] font-bold text-rose-300">
              {currentRoll > 0.5 ? '▶ RIGHT' : currentRoll < -0.5 ? '◀ LEFT' : 'LEVEL'}
            </span>
          </div>
        </div>

        {/* BOTTOM-LOCKED SCALE DIAL (用户需求：侧倾仪适配横竖屏时刻度盘锁定于泡泡底部，竖屏平行于屏短边，横屏平行于屏长边) */}
        <div className="relative w-full h-18 flex flex-col items-center justify-end shrink-0 mt-auto pb-0.5">
          {/* Bottom Arc Scale SVG: Anchored flush at bottom curve of the bubble */}
          <svg className="w-full h-14 pointer-events-none" viewBox="0 0 180 70">
            {/* Bottom Scale Arc: parallel to bottom edge */}
            <path
              d="M 20 48 A 75 75 0 0 0 160 48"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3.5"
            />
            {/* Colored Danger Zones on outer ends */}
            <path
              d="M 20 48 A 75 75 0 0 0 45 56"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4.5"
            />
            <path
              d="M 135 56 A 75 75 0 0 0 160 48"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4.5"
            />

            {/* Dial Tick Marks locked to bottom arc */}
            {[-45, -30, -20, -10, 0, 10, 20, 30, 45].map((deg) => {
              const rad = ((deg + 90) * Math.PI) / 180;
              const r1 = 56;
              const r2 = deg % 20 === 0 ? 70 : 64;
              const cx = 90;
              const cy = -8;
              const x1 = cx + r1 * Math.cos(rad);
              const y1 = cy + r1 * Math.sin(rad);
              const x2 = cx + r2 * Math.cos(rad);
              const y2 = cy + r2 * Math.sin(rad);
              const isDangerTick = Math.abs(deg) >= 30;
              return (
                <g key={`tick-${deg}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDangerTick ? '#f43f5e' : deg === 0 ? '#38bdf8' : '#e2e8f0'}
                    strokeWidth={deg === 0 ? '2.5' : deg % 20 === 0 ? '1.8' : '1.2'}
                  />
                  {deg % 30 === 0 && (
                    <text
                      x={cx + (r2 + 7) * Math.cos(rad)}
                      y={cy + (r2 + 7) * Math.sin(rad) + 2}
                      fill={isDangerTick ? '#f87171' : '#cbd5e1'}
                      fontSize="6.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {Math.abs(deg)}°
                    </text>
                  )}
                </g>
              );
            })}

            {/* Needle Sweeping Downward to Bottom Dial */}
            <g
              transform={`rotate(${currentRoll} 90 -8)`}
              className="transition-transform duration-75 ease-out"
            >
              <line
                x1="90"
                y1="22"
                x2="90"
                y2="57"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polygon points="90,62 86,54 94,54" fill="#f43f5e" />
            </g>
          </svg>

          {/* Bottom Controls & Orientation Lock Tag */}
          <div className="flex items-center justify-between w-full px-2 pt-0.5">
            <span className="text-[8px] font-mono text-rose-400 font-bold">
              ◀ L
            </span>
            <div className="flex items-center gap-1">
              {onOpenCalibration ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCalibration();
                  }}
                  title="学习与校准 / Calibration"
                  className="no-drag text-[8px] text-amber-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 active:scale-95 transition-all shadow-sm"
                >
                  <span>校准</span>
                </button>
              ) : onCalibrateZero && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCalibrateZero(rawPitch, rawRoll);
                  }}
                  title="校准水平归零 / Zero Calibrate"
                  className="no-drag text-[8px] text-rose-300 hover:text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 active:scale-95 transition-all shadow-sm"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>归零</span>
                </button>
              )}
              <span className="text-[7.5px] font-mono text-slate-300 bg-slate-900/90 px-1 py-0.2 rounded border border-white/10">
                {orientation === 'landscape' ? '横屏(平行长边)' : '竖屏(平行短边)'}
              </span>
            </div>
            <span className="text-[8px] font-mono text-rose-400 font-bold">
              R ▶
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
