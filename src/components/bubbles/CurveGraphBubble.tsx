import React, { useRef, useEffect, useState } from 'react';
import { Activity, TrendingUp, Layers, Sliders, RefreshCw } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';

interface CurveGraphBubbleProps {
  type: 'speed' | 'accel';
  telemetry: TelemetryData;
  speedSettings: BubbleSettings['speed_graph'];
  accelSettings: BubbleSettings['accel_graph'];
  lang: Language;
  bubbleSize: number;
}

export const CurveGraphBubble: React.FC<CurveGraphBubbleProps> = ({
  type,
  telemetry,
  speedSettings,
  accelSettings,
  lang,
  bubbleSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeed = type === 'speed';

  // State: Curve Mode: 'merged_dual' (本图两线合并) or 'quad_merged' (4参数全合并同屏)
  // 用户需求: "在速度与加速度时间曲线可以两线合并在一张图两个4个参数零点在中间"
  const [displayMode, setDisplayMode] = useState<'merged_dual' | 'quad_merged'>('merged_dual');

  // Sensitivity multiplier: 用户需求 "波动辐度可以大一点...速度与加速度敏感性就可调高"
  // Multipliers: 1x, 2x, 2.5x (default), 4x
  const [sensitivity, setSensitivity] = useState<number>(2.5);

  const cycleSensitivity = () => {
    setSensitivity((prev) => {
      if (prev === 1.0) return 2.0;
      if (prev === 2.0) return 2.5;
      if (prev === 2.5) return 4.0;
      return 1.0;
    });
  };

  const speedShort = telemetry.speedHistoryShort || telemetry.speedHistory || [];
  const speedLong = telemetry.speedHistoryLong || telemetry.speedHistory || [];
  const accelShort = telemetry.accelHistoryShort || telemetry.accelHistory || [];
  const accelLong = telemetry.accelHistoryLong || telemetry.accelHistory || [];

  // Content scale: occupies ~80% of bubble diameter when enlarged
  const scale = (bubbleSize * 0.8) / 170;

  // Colors as requested:
  // 用户要求: "4个曲线颜色一个红、蓝，一个黄蓝，通过Y轴上的颜色文字提示可以区分曲线不同"
  const COLOR_SPEED_SHORT = '#ef4444'; // 红 (Red: 实时短时速度)
  const COLOR_SPEED_LONG = '#3b82f6';  // 蓝 (Blue: 长时均速)
  const COLOR_ACCEL_SHORT = '#eab308'; // 黄 (Yellow: 瞬时短时加速度)
  const COLOR_ACCEL_LONG = '#06b6d4';  // 蓝 (Cyan-Blue: 长时综合G值)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Zero-point right in the middle: 用户要求 "零点在中间"
    const zeroY = height * 0.5;

    // Background horizontal guideline grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, height * 0.25);
    ctx.lineTo(width - 8, height * 0.25);
    ctx.moveTo(8, height * 0.75);
    ctx.lineTo(width - 8, height * 0.75);
    ctx.stroke();

    // Prominent Center Zero Baseline (零点基线)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(6, zeroY);
    ctx.lineTo(width - 6, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Helper to draw a single smooth line onto the canvas
    const drawLine = (
      data: { time: number; speedKmh?: number; gForce?: number }[],
      valueGetter: (item: any) => number,
      maxReference: number,
      strokeColor: string,
      lineWidth: number,
      isDashed = false,
      fillGradient = false
    ) => {
      if (!data || data.length < 2) return;
      const len = data.length;
      const stepX = (width - 24) / Math.max(len - 1, 1);
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < len; i++) {
        const val = valueGetter(data[i]);
        const x = 12 + i * stepX;
        // Calculate deflection from zero center with sensitivity multiplier
        // "波动辐度可以大一点，速度与加速度敏感性就可调高"
        const normalized = (val / Math.max(maxReference, 1)) * sensitivity;
        const deflection = normalized * (height * 0.42);
        const y = Math.max(3, Math.min(height - 3, zeroY - deflection));
        points.push({ x, y });
      }

      // Optional subtle gradient fill under the curve
      if (fillGradient && points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, zeroY);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, zeroY);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, `${strokeColor}40`);
        grad.addColorStop(1, `${strokeColor}05`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw stroke
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      if (isDashed) {
        ctx.setLineDash([4, 2]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.setLineDash([]);

      // Live cursor indicator on last point
      if (points.length > 0) {
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    };

    // Determine which lines to draw
    const showAllFour = displayMode === 'quad_merged';

    if (showAllFour || isSpeed) {
      // Line 1: 实时短时速度 (Red / 红)
      drawLine(
        speedShort,
        (d) => d.speedKmh ?? 0,
        speedSettings.maxScale || 120,
        COLOR_SPEED_SHORT,
        2.0,
        false,
        !showAllFour
      );

      // Line 2: 长时平均速度 (Blue / 蓝)
      drawLine(
        speedLong,
        (d) => d.speedKmh ?? 0,
        speedSettings.maxScale || 120,
        COLOR_SPEED_LONG,
        1.6,
        true,
        false
      );
    }

    if (showAllFour || !isSpeed) {
      // Line 3: 瞬时短时加速度 (Yellow / 黄)
      drawLine(
        accelShort,
        (d) => d.gForce ?? 0,
        accelSettings.maxG || 1.5,
        COLOR_ACCEL_SHORT,
        2.0,
        false,
        !showAllFour
      );

      // Line 4: 长时综合加速度 (Cyan-Blue / 蓝)
      drawLine(
        accelLong,
        (d) => d.gForce ?? 0,
        accelSettings.maxG || 1.5,
        COLOR_ACCEL_LONG,
        1.6,
        true,
        false
      );
    }
  }, [
    speedShort,
    speedLong,
    accelShort,
    accelLong,
    displayMode,
    isSpeed,
    sensitivity,
    speedSettings.maxScale,
    accelSettings.maxG,
  ]);

  const currentSpeed = telemetry.speedKmh;
  const currentG = telemetry.gForce;

  const headerTitle = displayMode === 'quad_merged'
    ? (lang === 'en' ? '4-PARAM MERGED' : '4参数同屏合并曲线')
    : isSpeed
    ? (lang === 'en' ? 'SPEED DUAL CURVES' : '速度双线合并曲线')
    : (lang === 'en' ? 'ACCEL DUAL CURVES' : '加速度双线合并曲线');

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      <div className="flex flex-col items-center justify-center gap-0.5 w-full max-w-[150px]">
        {/* Top Header with title & real-time badge */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            {isSpeed ? (
              <TrendingUp className="w-3 h-3 text-red-400" />
            ) : (
              <Activity className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[9.5px] font-bold tracking-tight text-slate-200 truncate">
              {headerTitle}
            </span>
          </div>

          {/* Mode Switcher Pill */}
          <button
            onClick={() => setDisplayMode(displayMode === 'merged_dual' ? 'quad_merged' : 'merged_dual')}
            title="点击切换：两线合并 / 4参数全合并"
            className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[8px] font-mono text-cyan-300 border border-slate-700 active:scale-95 transition-all"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>{displayMode === 'quad_merged' ? '4合1' : '双线'}</span>
          </button>
        </div>

        {/* Real-time value indicators */}
        <div className="w-full flex items-center justify-between px-1.5 py-0.5 bg-slate-950/70 rounded border border-white/10 font-mono text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {currentSpeed.toFixed(0)} <span className="text-[7.5px] text-slate-400">km/h</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              {currentG >= 0 ? `+${currentG.toFixed(2)}` : currentG.toFixed(2)} <span className="text-[7.5px] text-slate-400">G</span>
            </span>
          </div>
          <button
            onClick={cycleSensitivity}
            title="点击切换曲线波动敏感度 (提高波动幅度)"
            className="text-[8px] px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold active:scale-95"
          >
            敏度:×{sensitivity}
          </button>
        </div>

        {/* Central Merged Canvas Stage with Y-Axis Color Coded Text (零点在中间) */}
        {/* 用户要求: "（4个曲线颜色一个红、蓝，一个黄蓝，通过Y轴上的颜色文字提示可以区分曲线不同）" */}
        <div className="relative w-full h-[76px] bg-slate-950/90 rounded border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden">
          {/* Left Y-Axis Color-Coded Labels (Speed Parameters) */}
          <div className="absolute left-0.5 inset-y-0 flex flex-col justify-between py-1 z-10 pointer-events-none text-[7px] font-mono leading-none font-bold">
            <span className="text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]">
              ▲红:短速
            </span>
            <span className="text-slate-400 bg-slate-900/80 px-0.5 rounded border border-white/10">
              — 0基线 —
            </span>
            <span className="text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]">
              ▼蓝:长速
            </span>
          </div>

          {/* Right Y-Axis Color-Coded Labels (Accel Parameters) */}
          <div className="absolute right-0.5 inset-y-0 flex flex-col justify-between py-1 z-10 pointer-events-none text-[7px] font-mono leading-none font-bold text-right">
            <span className="text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.8)]">
              黄:瞬G▲
            </span>
            <span className="text-slate-400 bg-slate-900/80 px-0.5 rounded border border-white/10">
              — 0基线 —
            </span>
            <span className="text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]">
              蓝:长G▼
            </span>
          </div>

          {/* High-Resolution HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={146}
            height={74}
            className="w-full h-full"
          />
        </div>

        {/* Bottom Legend & Status Bar */}
        <div className="w-full flex items-center justify-between px-1 text-[8px] font-mono text-slate-400 pt-0.5">
          <div className="flex items-center gap-1">
            <span className="text-red-400 font-bold">●红</span>
            <span className="text-blue-400 font-bold">●蓝(速)</span>
            <span className="text-yellow-400 font-bold">●黄</span>
            <span className="text-cyan-400 font-bold">●蓝(加)</span>
          </div>
          <span className="text-slate-400">
            {displayMode === 'quad_merged' ? '4线合并' : isSpeed ? '双线合并' : '加速合并'}
          </span>
        </div>
      </div>
    </div>
  );
};
