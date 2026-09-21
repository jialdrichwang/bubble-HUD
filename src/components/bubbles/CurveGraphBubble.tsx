import React, { useRef, useEffect } from 'react';
import { TelemetryData, BubbleSettings, Language } from '../../types';

interface CurveGraphBubbleProps {
  type: 'speed' | 'accel';
  telemetry: TelemetryData;
  speedSettings: BubbleSettings['speed_graph'];
  accelSettings: BubbleSettings['accel_graph'];
  lang: Language;
  bubbleSize: number;
}

/**
 * User Request Implementation:
 * "是速度，速度值，速度时间曲线（红bubble 10）/ 加速度，加速值，加速曲线（蓝 bubble11）"
 * "速度与加速时间曲线里面内容太多，全部精减，只留下坐标，中心的速度然后当前值，加速度然后当前值。
 * 让空间出来给予曲线显示，用文字颜对应即时曲线，一张表，一个文字，一个数值，余下不要别的，
 * 曲线做反指数处理，在速度曲线120以内变化明显，大于这个数，曲线动态辐度就变低，120-400,数值越大，增量越少,
 * 加速曲线也是一样，因这没有在手参数，不知道那怕是赛车，加速在那个范围，设一个比较明显好看的加速时间曲线，
 * 减少速度与加速度，在一个比较长时间低或过载显示状态。谢谢"
 */
export const CurveGraphBubble: React.FC<CurveGraphBubbleProps> = ({
  type,
  telemetry,
  bubbleSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeed = type === 'speed';

  const currentSpeed = telemetry.speedKmh ?? 0;
  const currentG = telemetry.gForce ?? 0;

  // History data points
  const speedPoints = telemetry.speedHistoryShort && telemetry.speedHistoryShort.length > 0
    ? telemetry.speedHistoryShort
    : telemetry.speedHistory || [];

  const accelPoints = telemetry.accelHistoryShort && telemetry.accelHistoryShort.length > 0
    ? telemetry.accelHistoryShort
    : telemetry.accelHistory || [];

  // Scaling factor for bubble size
  const scale = (bubbleSize * 0.86) / 170;

  // Colors:
  // 速度: 鲜红 (#ef4444)
  // 加速度: 鲜蓝/天青蓝 (#38bdf8)
  const COLOR_THEME = isSpeed ? '#ef4444' : '#38bdf8';
  const COLOR_GLOW_START = isSpeed ? 'rgba(239, 68, 68, 0.28)' : 'rgba(56, 189, 248, 0.28)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 26; // Left margin for coordinate labels
    const padR = 8;
    const padT = 8;
    const padB = 8;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    ctx.font = '8px monospace';
    ctx.textBaseline = 'middle';

    // 垂直时间网格分割线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let f = 0.25; f < 1; f += 0.25) {
      const gx = padL + plotW * f;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, height - padB);
      ctx.stroke();
    }

    // 左侧 Y 轴主垂直标尺轴线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, height - padB);
    ctx.stroke();

    if (isSpeed) {
      // -------------------------------------------------------------
      // 【速度，速度值，速度时间曲线（红 bubble 10）】
      // -------------------------------------------------------------
      // 速度大于等于0，因此0基准线位于图表底部，将全部垂直高度给予速度波形
      const zeroY = height - padB - 2;
      const maxH = plotH - 4;

      // 反指数映射: 0~120 km/h 变化明显 (占 65% 幅度); 120~400 km/h 数值越大增量越少
      const getSpeedY = (sp: number): number => {
        const s = Math.max(0, sp);
        let norm: number;
        if (s <= 120) {
          norm = (s / 120) * 0.65;
        } else {
          const excess = s - 120;
          const compression = 1 - Math.exp(-excess / 120);
          norm = 0.65 + 0.32 * compression;
        }
        return zeroY - norm * maxH;
      };

      // 400 km/h 顶部参考线
      const topLimitY = zeroY - 0.97 * maxH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(padL, topLimitY);
      ctx.lineTo(width - padR, topLimitY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('400', padL - 4, topLimitY);

      // 120 km/h 灵敏度临界拐点参考虚线
      const line120Y = getSpeedY(120);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, line120Y);
      ctx.lineTo(width - padR, line120Y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.fillText('120', padL - 4, line120Y);

      // 0 基线 (底部实线)
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(width - padR, zeroY);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('0', padL - 4, zeroY);

      // 绘制速度时间曲线 (红色)
      if (speedPoints.length > 1) {
        const len = speedPoints.length;
        const stepX = plotW / Math.max(len - 1, 1);
        const curvePoints: { x: number; y: number }[] = [];

        for (let i = 0; i < len; i++) {
          const sp = speedPoints[i].speedKmh ?? 0;
          const x = padL + i * stepX;
          const y = getSpeedY(sp);
          curvePoints.push({ x, y });
        }

        // 曲线下方红色渐变填充
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, zeroY);
        for (let i = 0; i < len; i++) {
          ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.lineTo(curvePoints[len - 1].x, zeroY);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padT, 0, zeroY);
        grad.addColorStop(0, COLOR_GLOW_START);
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
        ctx.fillStyle = grad;
        ctx.fill();

        // 曲线主线条
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < len; i++) {
          ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.strokeStyle = COLOR_THEME;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 实时最新点指示光标
        const lastPt = curvePoints[len - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = COLOR_THEME;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    } else {
      // -------------------------------------------------------------
      // 【加速度，加速值，加速曲线（蓝 bubble 11）】
      // -------------------------------------------------------------
      // 加速度有正加速与负制动，零点在正中心
      const zeroY = padT + plotH * 0.5;
      const maxDeflection = plotH * 0.46;

      // 反指数映射: 0~±0.35G 变化明显 (占 65% 幅度); ±0.35G~±2.0G+ 反指数平滑压缩
      const getAccelY = (g: number): number => {
        const absG = Math.abs(g);
        let norm: number;
        if (absG <= 0.35) {
          norm = (absG / 0.35) * 0.65;
        } else {
          const excess = absG - 0.35;
          const compression = 1 - Math.exp(-excess / 0.7);
          norm = 0.65 + 0.32 * compression;
        }
        const sign = g >= 0 ? 1 : -1;
        return zeroY - sign * norm * maxDeflection;
      };

      // +2.0G 顶部上限
      const topLimitY = zeroY - 0.97 * maxDeflection;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(padL, topLimitY);
      ctx.lineTo(width - padR, topLimitY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('+2G', padL - 4, topLimitY);

      // +0.35G 灵敏度拐点参考线
      const linePos035Y = getAccelY(0.35);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, linePos035Y);
      ctx.lineTo(width - padR, linePos035Y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.fillText('+G', padL - 4, linePos035Y);

      // -0.35G 制动灵敏度拐点参考线
      const lineNeg035Y = getAccelY(-0.35);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(padL, lineNeg035Y);
      ctx.lineTo(width - padR, lineNeg035Y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.fillText('-G', padL - 4, lineNeg035Y);

      // -2.0G 底部下限
      const btmLimitY = zeroY + 0.97 * maxDeflection;
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(padL, btmLimitY);
      ctx.lineTo(width - padR, btmLimitY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('-2G', padL - 4, btmLimitY);

      // 中心 0 基线 (高对比度零点基线)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(width - padR, zeroY);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('0', padL - 4, zeroY);

      // 绘制加速度时间曲线 (蓝色)
      if (accelPoints.length > 1) {
        const len = accelPoints.length;
        const stepX = plotW / Math.max(len - 1, 1);
        const curvePoints: { x: number; y: number }[] = [];

        for (let i = 0; i < len; i++) {
          const g = accelPoints[i].gForce ?? 0;
          const x = padL + i * stepX;
          const y = getAccelY(g);
          curvePoints.push({ x, y });
        }

        // 曲线与零线之间蓝色微光填充
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, zeroY);
        for (let i = 0; i < len; i++) {
          ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.lineTo(curvePoints[len - 1].x, zeroY);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padT, 0, height - padB);
        grad.addColorStop(0, COLOR_GLOW_START);
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.02)');
        grad.addColorStop(1, COLOR_GLOW_START);
        ctx.fillStyle = grad;
        ctx.fill();

        // 曲线主线条
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < len; i++) {
          ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.strokeStyle = COLOR_THEME;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 实时最新点指示光标
        const lastPt = curvePoints[len - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = COLOR_THEME;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }
  }, [isSpeed, speedPoints, accelPoints, currentSpeed, currentG]);

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-between p-2 select-none overflow-hidden"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* 
        用户要求：
        "一张表，一个文字，一个数值，余下不要别的，用文字颜对应即时曲线"
        - 红 bubble 10: 速度，速度值，速度时间曲线
        - 蓝 bubble 11: 加速度，加速值，加速曲线
      */}
      <div className="flex items-center justify-center w-full px-2 pt-0.5 shrink-0 z-10 select-none">
        {isSpeed ? (
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-[12px] font-black text-red-500 tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
              速度
            </span>
            <span className="text-[20px] font-black text-red-400 tracking-tight drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
              {currentSpeed.toFixed(0)}
            </span>
            <span className="text-[10px] text-red-300 font-bold opacity-85">
              km/h
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-[12px] font-black text-sky-400 tracking-wider drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">
              加速度
            </span>
            <span className="text-[20px] font-black text-sky-300 tracking-tight drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]">
              {currentG >= 0 ? `+${currentG.toFixed(2)}` : currentG.toFixed(2)}
            </span>
            <span className="text-[10px] text-sky-200 font-bold opacity-85">
              G
            </span>
          </div>
        )}
      </div>

      {/* 
        全屏纯净图表，最大化曲线显示空间 ("一张表，只留下坐标，让空间出来给予曲线显示，余下不要别的")
      */}
      <div
        className={`relative w-full flex-1 mt-1 rounded-lg bg-slate-950/90 border overflow-hidden flex items-center justify-center shadow-inner ${
          isSpeed ? 'border-red-950/60' : 'border-sky-950/60'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={240}
          height={124}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
