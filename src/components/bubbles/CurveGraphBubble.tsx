import React, { useRef, useEffect, useState } from 'react';
import { Activity, TrendingUp, Layers } from 'lucide-react';
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
  const shortCanvasRef = useRef<HTMLCanvasElement>(null);
  const longCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeed = type === 'speed';

  const currentValue = isSpeed ? telemetry.speedKmh : telemetry.gForce;
  const unit = isSpeed ? 'km/h' : 'G';
  const color = isSpeed ? '#ec4899' : '#f97316';
  const colorSecondary = isSpeed ? '#06b6d4' : '#eab308';

  const shortHistory = isSpeed
    ? telemetry.speedHistoryShort || telemetry.speedHistory
    : telemetry.accelHistoryShort || telemetry.accelHistory;

  const longHistory = isSpeed
    ? telemetry.speedHistoryLong || telemetry.speedHistory
    : telemetry.accelHistoryLong || telemetry.accelHistory;

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  // Helper to draw a single graph layer
  const drawGraph = (
    canvas: HTMLCanvasElement,
    data: { time: number; speedKmh?: number; gForce?: number }[],
    strokeColor: string,
    isShortTerm: boolean
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, height * 0.5);
    ctx.lineTo(width - 8, height * 0.5);
    ctx.stroke();

    if (!data || data.length < 2) return;

    let minVal = 0;
    let maxVal = isSpeed ? speedSettings.maxScale : accelSettings.maxG;

    if (!isSpeed) {
      minVal = -accelSettings.maxG;
    }

    // Zero baseline for acceleration G-force
    if (!isSpeed) {
      const zeroY = height * 0.5;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(6, zeroY);
      ctx.lineTo(width - 6, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const len = data.length;
    const stepX = (width - 16) / Math.max(len - 1, 1);
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < len; i++) {
      const item = data[i];
      const val = isSpeed ? (item.speedKmh ?? 0) : (item.gForce ?? 0);
      const x = 8 + i * stepX;
      let y: number;

      if (isSpeed) {
        y = height - 4 - ((val - minVal) / Math.max(maxVal - minVal, 1)) * (height - 8);
      } else {
        const zeroY = height * 0.5;
        y = zeroY - (val / maxVal) * (height * 0.45);
      }
      points.push({ x, y: Math.max(3, Math.min(height - 3, y)) });
    }

    // Gradient fill area under curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, height - 2);
    ctx.lineTo(points[0].x, height - 2);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${strokeColor}55`);
    gradient.addColorStop(1, `${strokeColor}05`);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isShortTerm ? 2 : 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Live cursor pulse on short-term layer
    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, isShortTerm ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  useEffect(() => {
    if (shortCanvasRef.current) {
      drawGraph(shortCanvasRef.current, shortHistory, color, true);
    }
    if (longCanvasRef.current) {
      drawGraph(longCanvasRef.current, longHistory, colorSecondary, false);
    }
  }, [shortHistory, longHistory, isSpeed, speedSettings.maxScale, accelSettings.maxG, color, colorSecondary]);

  const title = isSpeed
    ? lang === 'en'
      ? 'SPEED DUAL CURVES'
      : lang === 'zh'
      ? '速度双层曲线'
      : '速度双层 speed curve'
    : lang === 'en'
    ? 'ACCEL DUAL CURVES'
    : lang === 'zh'
    ? '加速双层曲线'
    : '加速双层 accel curve';

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container with Safe Circular Inset */}
      <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[146px]">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between px-1.5 pt-0.5">
          <div className="flex items-center gap-1">
            {isSpeed ? (
              <TrendingUp className="w-3 h-3 text-pink-400" />
            ) : (
              <Activity className="w-3 h-3 text-orange-400" />
            )}
            <span className={`text-[10px] font-bold ${isSpeed ? 'text-pink-300' : 'text-orange-300'}`}>
              {title}
            </span>
          </div>
          <div className="font-mono text-xs font-bold text-white flex items-center gap-0.5">
            <span>{isSpeed ? currentValue.toFixed(0) : currentValue >= 0 ? `+${currentValue.toFixed(2)}` : currentValue.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 font-normal">{unit}</span>
          </div>
        </div>

        {/* Two-Layer Stacked Curves (短时 20s + 长时 1小时) */}
        <div className="w-full flex flex-col gap-1 my-0.5 justify-center overflow-hidden">
          {/* Layer 1: Short-term (20 seconds) */}
          <div className="w-full bg-slate-950/60 rounded border border-white/10 p-1 flex flex-col justify-between">
            <div className="flex items-center justify-between px-1 text-[8px] font-mono leading-none mb-0.5">
              <span className="text-pink-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                {lang === 'en' ? 'SHORT 20s' : '短时 20s'}
              </span>
              <span className="text-slate-400">
                {isSpeed ? `${currentValue.toFixed(0)} km/h` : `${currentValue >= 0 ? '+' : ''}${currentValue.toFixed(2)}G`}
              </span>
            </div>
            <div className="relative w-full h-[34px] flex items-center justify-center overflow-hidden">
              <canvas
                ref={shortCanvasRef}
                width={140}
                height={34}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Layer 2: Long-term (1 Hour / 60 mins) */}
          <div className="w-full bg-slate-950/60 rounded border border-white/10 p-1 flex flex-col justify-between">
            <div className="flex items-center justify-between px-1 text-[8px] font-mono leading-none mb-0.5">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {lang === 'en' ? 'LONG 1 HOUR' : '长时 1h'}
              </span>
              <span className="text-slate-400">
                {isSpeed ? `峰值: ${telemetry.maxSpeedKmh.toFixed(0)}` : '1h G分布'}
              </span>
            </div>
            <div className="relative w-full h-[34px] flex items-center justify-center overflow-hidden">
              <canvas
                ref={longCanvasRef}
                width={140}
                height={34}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Bottom Footer with Safe Inset */}
        <div className="w-full flex items-center justify-between px-2 text-[8.5px] font-mono text-slate-400 border-t border-white/15 pt-0.5 pb-0.5 mb-0.5">
          <span className="flex items-center gap-1 text-slate-400">
            <Layers className="w-2.5 h-2.5 text-slate-400" />
            <span>双层 Dual</span>
          </span>
          <span>{isSpeed ? `标尺: ${speedSettings.maxScale}km/h` : `量程: ±${accelSettings.maxG}G`}</span>
        </div>
      </div>
    </div>
  );
};
