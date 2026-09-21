import React, { useState } from 'react';
import { X, Check, RotateCw, Compass, Mountain, AlertCircle, RefreshCw } from 'lucide-react';
import { BubbleSettings, TelemetryData } from '../types';

interface InclinometerCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BubbleSettings;
  onUpdateSettings: (newSettings: Partial<BubbleSettings>) => void;
  telemetry: TelemetryData;
}

export const InclinometerCalibrationModal: React.FC<InclinometerCalibrationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  telemetry,
}) => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    settings.spiritLevelOrientation || 'landscape'
  );
  const [pitchOffset, setPitchOffset] = useState<number>(settings.spiritLevelPitchOffset || 0);
  const [rollOffset, setRollOffset] = useState<number>(settings.spiritLevelRollOffset || 0);
  const [gainFactor, setGainFactor] = useState<number>(settings.spiritLevelGainFactor || 1.0);
  const [useGpsSlope, setUseGpsSlope] = useState<boolean>(settings.spiritLevelUseGpsSlope ?? true);

  // Manual test angle input for machine learning calibration
  const [knownTestAngle, setKnownTestAngle] = useState<number>(15);
  const [calibTarget, setCalibTarget] = useState<'roll' | 'pitch'>('roll');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  if (!isOpen) return null;

  // Raw axis mapping based on screen orientation, swapping, and axis inversion
  const isSwapped = settings.swapSpiritAndTiltParams ?? false;
  const invertRoll = settings.spiritLevelInvertRoll ?? false;
  const invertPitch = settings.spiritLevelInvertPitch ?? false;
  const invertTiltRoll = settings.tiltMeterInvertRoll ?? false;

  let basePitch = orientation === 'landscape' ? telemetry.pitchDeg : telemetry.rollDeg;
  let baseRoll = orientation === 'landscape' ? telemetry.rollDeg : telemetry.pitchDeg;
  if (isSwapped) {
    const temp = basePitch;
    basePitch = baseRoll;
    baseRoll = temp;
  }

  const rawPitch = invertPitch ? -basePitch : basePitch;
  const rawRoll = invertRoll ? -baseRoll : baseRoll;

  // For Tilt Meter roll mapping
  let tmBaseRoll = orientation === 'landscape' ? telemetry.rollDeg : telemetry.pitchDeg;
  let tmBasePitch = orientation === 'landscape' ? telemetry.pitchDeg : telemetry.rollDeg;
  if (isSwapped) {
    const temp = tmBaseRoll;
    tmBaseRoll = tmBasePitch;
    tmBasePitch = temp;
  }
  const rawTmRoll = invertTiltRoll ? -tmBaseRoll : tmBaseRoll;

  // Calculated calibrated outputs
  const calibratedPitch = Number(((rawPitch - pitchOffset) * gainFactor).toFixed(1));
  const calibratedRoll = Number(((rawRoll - rollOffset) * gainFactor).toFixed(1));

  // Handle zeroing (平地基准校准 - 立即将水平仪与侧倾仪零基准写入全局状态并归零)
  const handleCalibrateZero = () => {
    const pOff = Number(rawPitch.toFixed(1));
    const rOff = Number(rawRoll.toFixed(1));
    const tmOff = Number(rawTmRoll.toFixed(1));

    setPitchOffset(pOff);
    setRollOffset(rOff);

    // 立即同步到全局仪表配置，确保背景水平仪与侧倾仪瞬间归零为 0.0°
    onUpdateSettings({
      spiritLevelPitchOffset: pOff,
      spiritLevelRollOffset: rOff,
      tiltMeterPitchOffset: pOff,
      tiltMeterRollOffset: tmOff,
      spirit_level: {
        ...settings.spirit_level,
        pitchOffset: pOff,
        rollOffset: rOff,
      },
      tilt_meter: {
        ...settings.tilt_meter,
        zeroOffset: tmOff,
      },
    });

    setFeedbackMsg(`已精准学习零点并归零！(俯仰偏置: ${pOff}°, 侧倾偏置: ${rOff}° / 侧倾仪: ${tmOff}°)`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Handle artificial angle learning (人工变换角度标定增益)
  const handleLearnAngle = () => {
    if (calibTarget === 'roll') {
      const delta = Math.abs(rawRoll - rollOffset);
      if (delta < 1.0) {
        setFeedbackMsg('当前左右侧倾角度过小，请将设备或车辆侧向倾斜至少 5° 以上再进行侧倾角学习！');
        setTimeout(() => setFeedbackMsg(''), 4500);
        return;
      }
      const computedGain = Number((Math.abs(knownTestAngle) / delta).toFixed(3));
      const safeGain = Math.max(0.4, Math.min(2.5, computedGain));
      setGainFactor(safeGain);
      setFeedbackMsg(`侧倾仪左右倾角自学习成功！计算得侧倾增益系数: ${safeGain} (标定基准: ${knownTestAngle}°)`);
      setTimeout(() => setFeedbackMsg(''), 4500);
    } else {
      const delta = Math.abs(rawPitch - pitchOffset);
      if (delta < 1.0) {
        setFeedbackMsg('当前前后俯仰角度过小，请将设备或车辆前后倾斜至少 5° 以上再进行俯仰坡度学习！');
        setTimeout(() => setFeedbackMsg(''), 4500);
        return;
      }
      const computedGain = Number((Math.abs(knownTestAngle) / delta).toFixed(3));
      const safeGain = Math.max(0.4, Math.min(2.5, computedGain));
      setGainFactor(safeGain);
      setFeedbackMsg(`水平仪前后坡度自学习成功！计算得俯仰增益系数: ${safeGain} (标定基准: ${knownTestAngle}°)`);
      setTimeout(() => setFeedbackMsg(''), 4500);
    }
  };

  // Reset to factory defaults
  const handleResetDefaults = () => {
    setPitchOffset(0);
    setRollOffset(0);
    setGainFactor(1.0);
    setFeedbackMsg('已恢复出厂标定参数 (偏置: 0°, 增益: 1.0)');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Save changes
  const handleSave = () => {
    const pOff = Number(pitchOffset.toFixed(1));
    const rOff = Number(rollOffset.toFixed(1));
    const tmOff = Number(rawTmRoll.toFixed(1));

    onUpdateSettings({
      spiritLevelOrientation: orientation,
      spiritLevelPitchOffset: pOff,
      spiritLevelRollOffset: rOff,
      spiritLevelGainFactor: gainFactor,
      spiritLevelUseGpsSlope: useGpsSlope,
      tiltMeterOrientation: orientation,
      tiltMeterPitchOffset: pOff,
      tiltMeterRollOffset: tmOff,
      tiltMeterGainFactor: gainFactor,
      tiltMeterUseGpsSlope: useGpsSlope,
      spirit_level: {
        ...settings.spirit_level,
        pitchOffset: pOff,
        rollOffset: rOff,
        gainFactorPitch: gainFactor,
        gainFactorRoll: gainFactor,
        screenOrientation: orientation,
      },
      tilt_meter: {
        ...settings.tilt_meter,
        zeroOffset: tmOff,
        gainFactorRoll: gainFactor,
        screenOrientation: orientation,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">水平仪 & 侧倾仪 姿态学习与校准</h2>
              <p className="text-xs text-slate-400">人工变换角度输入标定 · 横竖屏轴向对齐 · GPS高程参考</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Feedback banner */}
          {feedbackMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Section 1: Screen Orientation (横竖屏模式输入) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>1. 设备安装与屏幕摆放方向</span>
              <span className="text-[11px] text-amber-400 font-mono">必选同步</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  orientation === 'landscape'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-lg shadow-amber-900/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs font-medium">横屏模式 (Landscape)</div>
                  <div className="text-[10px] text-slate-400">平板/车机/横置支架</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  orientation === 'portrait'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-lg shadow-amber-900/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <RotateCw className="w-4 h-4 rotate-90" />
                <div className="text-left">
                  <div className="text-xs font-medium">竖屏模式 (Portrait)</div>
                  <div className="text-[10px] text-slate-400">手机/立式车载支架</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Real-time Live Sensor & Calibrated Readout */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>实时传感器与标定计算结果</span>
              <span className="text-[10px] text-slate-400">动态监控</span>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">校准后俯仰角 (Pitch)</div>
                <div className={`text-lg font-bold ${calibratedPitch >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {calibratedPitch > 0 ? `+${calibratedPitch}` : calibratedPitch}°
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">原始: {rawPitch.toFixed(1)}° | 偏置: {pitchOffset.toFixed(1)}°</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400">校准后侧倾角 (Roll)</div>
                <div className={`text-lg font-bold ${Math.abs(calibratedRoll) < 10 ? 'text-sky-400' : 'text-rose-400'}`}>
                  {calibratedRoll > 0 ? `+${calibratedRoll}` : calibratedRoll}°
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">原始: {rawRoll.toFixed(1)}° | 偏置: {rollOffset.toFixed(1)}°</div>
              </div>
            </div>
          </div>

          {/* Section 3: Step A - Zero Ground Baseline (0°基准平地校准) */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-200">2. 平地零位学习 (0° 基准)</div>
                <div className="text-[11px] text-slate-400">将车辆停放在已知水平地面，点击记录安装角度作为 0°</div>
              </div>
              <button
                type="button"
                onClick={handleCalibrateZero}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>学习零点 (0°)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Step B - Artificial Angle Learning (人工变换角度并输入数值让仪表学习) */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
            <div>
              <div className="font-semibold text-xs text-slate-200">3. 人工已知坡度/角度学习标定</div>
              <div className="text-[11px] text-slate-400">
                将车辆置于已知坡道（如地库 15°坡道）或侧斜坡，选择对应轴向输入真实角度让仪表自学习增益系数
              </div>
            </div>

            {/* Target Instrument / Axis Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">标定轴向:</span>
              <button
                type="button"
                onClick={() => setCalibTarget('roll')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  calibTarget === 'roll'
                    ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>左右侧倾仪 (Roll 侧倾)</span>
                <span className="text-[10px] font-mono text-rose-300/80">
                  当前: {Math.abs(rawRoll - rollOffset).toFixed(1)}°
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCalibTarget('pitch')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  calibTarget === 'pitch'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>前后水平仪 (Pitch 俯仰)</span>
                <span className="text-[10px] font-mono text-amber-300/80">
                  当前: {Math.abs(rawPitch - pitchOffset).toFixed(1)}°
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 mb-1 block">
                  输入已知真实{calibTarget === 'roll' ? '侧倾' : '坡道'}角度 (°)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="2"
                    max="45"
                    step="1"
                    value={knownTestAngle}
                    onChange={(e) => setKnownTestAngle(Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1">
                    {[10, 15, 20, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setKnownTestAngle(preset)}
                        className={`px-2 py-1 rounded text-[11px] font-mono border ${
                          knownTestAngle === preset
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {preset}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLearnAngle}
                className="px-3 py-2 mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>学习{calibTarget === 'roll' ? '侧倾' : '坡度'}增益</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              当前学习计算增益系数 k = <span className="text-amber-300 font-bold">{gainFactor}</span>
            </div>
          </div>

          {/* Section 5: GPS Elevation Slope Reference (长时间上下坡参考GPS高程数据) */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 flex items-center justify-between">
            <div className="space-y-0.5 pr-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-sky-400" />
                <span>长时间上下坡参考 GPS 高程数据滤波</span>
              </div>
              <div className="text-[11px] text-slate-400">
                车辆长距离行进时，结合卫星高程变化率计算连续坡度，抑制陀螺仪累计温漂与加减速扰动。
              </div>
              <div className="text-[10px] text-sky-300 font-mono mt-1">
                当前卫星估算长程坡度: {telemetry.gpsSlopeDeg ? `${telemetry.gpsSlopeDeg > 0 ? '+' : ''}${telemetry.gpsSlopeDeg}°` : '行车采集中 (待加速)'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={useGpsSlope}
              onChange={(e) => setUseGpsSlope(e.target.checked)}
              className="w-5 h-5 rounded accent-amber-500 cursor-pointer shrink-0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>恢复出厂标定</span>
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
            >
              保存标定参数
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
