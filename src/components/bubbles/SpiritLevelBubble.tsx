import React from 'react';
import { RotateCcw } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';
import { SphericalGyroInclinometer } from './inclinometer/SphericalGyroInclinometer';

interface SpiritLevelBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['spirit_level'];
  allSettings?: BubbleSettings;
  lang: Language;
  bubbleSize: number;
  onCalibrateZero?: (pitch: number, roll: number) => void;
  onOpenCalibration?: () => void;
}

export const SpiritLevelBubble: React.FC<SpiritLevelBubbleProps> = ({
  telemetry,
  settings,
  allSettings,
  lang,
  bubbleSize,
  onCalibrateZero,
  onOpenCalibration,
}) => {
  // Screen orientation axis mapping ("要同步输入目前是横屏还是竖屏模式")
  const orientation = allSettings?.spiritLevelOrientation || 'landscape';
  const pitchOffset = allSettings?.spiritLevelPitchOffset ?? settings.pitchOffset;
  const rollOffset = allSettings?.spiritLevelRollOffset ?? settings.rollOffset;
  const gainFactor = allSettings?.spiritLevelGainFactor ?? settings.sensitivity ?? 1.0;
  const useGpsSlope = allSettings?.spiritLevelUseGpsSlope ?? true;

  // Swapping and Inversion Flags (顶部滑动菜单设置)
  const isSwapped = allSettings?.swapSpiritAndTiltParams ?? false;
  const invertRoll = allSettings?.spiritLevelInvertRoll ?? false;
  const invertPitch = allSettings?.spiritLevelInvertPitch ?? false;

  // Raw mapping based on orientation (and parameter swapping if active)
  let basePitch = orientation === 'landscape' ? telemetry.pitchDeg : telemetry.rollDeg;
  let baseRoll = orientation === 'landscape' ? telemetry.rollDeg : telemetry.pitchDeg;

  if (isSwapped) {
    const temp = basePitch;
    basePitch = baseRoll;
    baseRoll = temp;
  }

  const rawPitch = invertPitch ? -basePitch : basePitch;
  const rawRoll = invertRoll ? -baseRoll : baseRoll;

  // Apply calibration offset and machine learning gain factor
  let calibratedPitch = (rawPitch - pitchOffset) * gainFactor;
  const calibratedRoll = (rawRoll - rollOffset) * gainFactor;

  // GPS elevation slope long-term reference ("长时间上坡与下坡可能参考GPS高程数据")
  if (useGpsSlope && telemetry.gpsSlopeDeg !== undefined && telemetry.speedKmh > 12) {
    // Softly blend 25% GPS slope for sustained hill climbs
    calibratedPitch = calibratedPitch * 0.75 + telemetry.gpsSlopeDeg * 0.25;
  }

  // Clamped offsets for graphical horizon display
  const horizonPitchOffset = Math.max(-35, Math.min(35, calibratedPitch));
  const horizonRollDeg = Math.max(-45, Math.min(45, calibratedRoll));

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  // Render Uploaded Spherical Gyro Attitude Style (水平仪.jpg)
  if (settings.style === 'spherical_gyro') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 w-full max-w-[148px]">
          {/* Header with Safe Edge Padding */}
          <div className="flex items-center justify-between w-full px-3 pt-1 text-[10px] font-mono font-bold text-slate-300">
            <span className="text-amber-400">PITCH {calibratedPitch >= 0 ? `+${calibratedPitch.toFixed(1)}°` : `${calibratedPitch.toFixed(1)}°`}</span>
            <span className="text-sky-400">ROLL {calibratedRoll >= 0 ? `+${calibratedRoll.toFixed(1)}°` : `${calibratedRoll.toFixed(1)}°`}</span>
          </div>

          {/* Spherical Gyro Attitude Ball */}
          <div className="my-0.5">
            <SphericalGyroInclinometer pitchDeg={calibratedPitch} rollDeg={calibratedRoll} />
          </div>

          {/* Bottom Calibration button with Safe Elevation from Curved Edge */}
          <div className="flex items-center justify-center gap-1.5 pt-1 pb-1 mb-1">
            {onOpenCalibration ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalibration();
                }}
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
                className="no-drag text-[8.5px] text-amber-300 hover:text-white flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 active:scale-95 transition-all shadow-sm"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>归零</span>
              </button>
            )}
            <span className="text-[8.5px] font-mono text-slate-400">
              {orientation === 'landscape' ? '横屏模式' : '竖屏模式'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Classic digital/spirit level view
  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container */}
      <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[170px]">
        {/* Header Title & Pitch readout in one row */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono font-bold text-purple-300">
            ▲ UP
          </span>
          <span className="text-[10px] font-bold text-purple-200">
            {lang === 'en' ? 'PITCH HUD' : lang === 'zh' ? '水平仪' : '水平仪 level'}
          </span>
          <span className="text-[10px] font-mono font-bold text-purple-300">
            {calibratedPitch >= 0 ? `+${calibratedPitch.toFixed(1)}°` : `${calibratedPitch.toFixed(1)}°`}
          </span>
        </div>

        {/* Central Moving Pitch & Roll Horizon Circle */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden border border-purple-500/40 bg-slate-950/80 shadow-inner flex items-center justify-center my-0.5">
          {/* Moving Horizon Line & Pitch Ladder */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out pointer-events-none"
            style={{
              transform: `rotate(${-horizonRollDeg}deg) translateY(${horizonPitchOffset * 1.2}px)`,
            }}
          >
            {/* Sky / Ground Division Line */}
            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_8px_#a855f7]" />

            {/* Pitch Ladder Marks (+10°, -10°) */}
            <div className="absolute -top-7 flex items-center gap-1">
              <span className="text-[7.5px] font-mono text-purple-300">+10</span>
              <div className="w-8 h-0.5 bg-purple-400/60" />
              <span className="text-[7.5px] font-mono text-purple-300">+10</span>
            </div>
            <div className="absolute -bottom-7 flex items-center gap-1">
              <span className="text-[7.5px] font-mono text-purple-300">-10</span>
              <div className="w-8 h-0.5 bg-purple-400/60" />
              <span className="text-[7.5px] font-mono text-purple-300">-10</span>
            </div>
          </div>

          {/* Static Center Crosshairs Aircraft Reticle */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-0.5 bg-yellow-400 shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400 bg-yellow-400/30 shadow-[0_0_8px_#eab308]" />
            <div className="w-4 h-0.5 bg-yellow-400 shadow-sm" />
          </div>

          {/* Spirit Bubble Bead */}
          <div
            className="absolute w-4 h-4 rounded-full bg-emerald-400/80 border border-white shadow-[0_0_10px_#10b981] transition-transform duration-75 pointer-events-none"
            style={{
              transform: `translate(${Math.max(-42, Math.min(42, calibratedRoll * 1.5))}px, ${Math.max(-42, Math.min(42, -calibratedPitch * 1.5))}px)`,
            }}
          />
        </div>

        {/* Bottom Subtext & One-Click Zero Calibration in same paragraph */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <span className="text-[9px] font-mono text-purple-300">
            ROLL {calibratedRoll >= 0 ? `+${calibratedRoll.toFixed(1)}°` : `${calibratedRoll.toFixed(1)}°`}
          </span>

          {onOpenCalibration ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCalibration();
              }}
              title="学习与校准 / Calibration"
              className="no-drag text-[8.5px] text-amber-300 hover:text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 active:scale-95 transition-all shadow-sm"
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
              className="no-drag text-[9px] text-purple-300 hover:text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw className="w-2.5 h-2.5 text-purple-300" />
              <span>归零</span>
            </button>
          )}

          <span className="text-[9px] font-mono text-purple-300">
            ▼ DOWN
          </span>
        </div>
      </div>
    </div>
  );
};
