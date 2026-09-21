/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BubbleConfig, BubbleId, BubbleSettings, HUDTheme, Language } from './types';
import { DEFAULT_BUBBLE_SETTINGS, getInitialBubbleConfigs } from './utils/telemetry';
import { useTelemetry } from './utils/useTelemetry';
import { HUDHeader } from './components/HUDHeader';
import { BubbleContainer } from './components/BubbleContainer';
import { BubbleSettingsModal } from './components/BubbleSettingsModal';
import { SpeedBubble } from './components/bubbles/SpeedBubble';
import { ClockBubble } from './components/bubbles/ClockBubble';
import { SpiritLevelBubble } from './components/bubbles/SpiritLevelBubble';
import { TiltMeterBubble } from './components/bubbles/TiltMeterBubble';
import { CoordsBubble } from './components/bubbles/CoordsBubble';
import { DrivingDataBubble } from './components/bubbles/DrivingDataBubble';
import { CompassBubble } from './components/bubbles/CompassBubble';
import { WeatherBubble } from './components/bubbles/WeatherBubble';
import { TimerBubble } from './components/bubbles/TimerBubble';
import { CurveGraphBubble } from './components/bubbles/CurveGraphBubble';
import { HardwarePermissionModal } from './components/HardwarePermissionModal';
import { InclinometerCalibrationModal } from './components/InclinometerCalibrationModal';

export default function App() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [lang, setLang] = useState<Language>('dual');
  const [isMirrorMode, setIsMirrorMode] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isScreensaverMode, setIsScreensaverMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<HUDTheme>('cyber-cyan');
  const [activeSettingBubble, setActiveSettingBubble] = useState<BubbleId | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings for each bubble (with persisted local storage restore if available)
  const [bubbleSettings, setBubbleSettings] = useState<BubbleSettings>(() => {
    try {
      const saved = localStorage.getItem('BUBBLE_HUD_SETTINGS');
      if (saved) {
        return { ...DEFAULT_BUBBLE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load saved bubble settings:', e);
    }
    return DEFAULT_BUBBLE_SETTINGS;
  });

  // Bubble layout configurations
  const [bubbles, setBubbles] = useState<BubbleConfig[]>(() =>
    getInitialBubbleConfigs(viewport.width, viewport.height)
  );

  const maxZIndexRef = useRef(20);
  const animFrameRef = useRef<number | null>(null);

  // Hook for live satellite GPS & orientation telemetry
  const {
    telemetry,
    simTargetSpeed,
    setSimTargetSpeed,
    gpsDiagnostic,
    resetTrip,
  } = useTelemetry(isSimulated);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Windows Bubble Screensaver Physics Loop ("像window的泡泡一样在不用的时侯打开开关，弹来弹去，像屏保那样")
  useEffect(() => {
    if (!isScreensaverMode) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const stepPhysics = () => {
      setBubbles((prevBubbles) => {
        const headerH = 54;
        const pad = 4;
        const next = prevBubbles.map((b) => {
          let vx = b.vx ?? (Math.random() > 0.5 ? 1 : -1);
          let vy = b.vy ?? (Math.random() > 0.5 ? 1 : -1);

          // Speed limit for calm, organic floating screensaver
          const speed = Math.hypot(vx, vy);
          if (speed > 2.5) {
            vx = (vx / speed) * 2.5;
            vy = (vy / speed) * 2.5;
          } else if (speed < 0.6) {
            vx = (vx / Math.max(speed, 0.01)) * 0.9;
            vy = (vy / Math.max(speed, 0.01)) * 0.9;
          }

          let nx = b.x + vx;
          let ny = b.y + vy;
          let isBouncing = false;

          // Wall bounces
          if (nx <= pad) {
            nx = pad;
            vx = Math.abs(vx);
            isBouncing = true;
          } else if (nx + b.size >= viewport.width - pad) {
            nx = viewport.width - b.size - pad;
            vx = -Math.abs(vx);
            isBouncing = true;
          }

          if (ny <= headerH + pad) {
            ny = headerH + pad;
            vy = Math.abs(vy);
            isBouncing = true;
          } else if (ny + b.size >= viewport.height - pad) {
            ny = viewport.height - b.size - pad;
            vy = -Math.abs(vy);
            isBouncing = true;
          }

          return { ...b, x: nx, y: ny, vx, vy, isBouncing };
        });

        // Bubble-to-bubble elastic collision & soft repulsion
        const len = next.length;
        for (let i = 0; i < len; i++) {
          for (let j = i + 1; j < len; j++) {
            const b1 = next[i];
            const b2 = next[j];
            const r1 = b1.size / 2;
            const r2 = b2.size / 2;
            const c1x = b1.x + r1;
            const c1y = b1.y + r1;
            const c2x = b2.x + r2;
            const c2y = b2.y + r2;

            const dx = c2x - c1x;
            const dy = c2y - c1y;
            const dist = Math.hypot(dx, dy);
            const minDist = r1 + r2;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;

              // Separate bubbles so they do not overlap
              const overlap = (minDist - dist) * 0.5;
              next[i].x -= nx * overlap;
              next[i].y -= ny * overlap;
              next[j].x += nx * overlap;
              next[j].y += ny * overlap;

              // Velocity exchange along normal
              const v1x = next[i].vx ?? 1;
              const v1y = next[i].vy ?? 1;
              const v2x = next[j].vx ?? -1;
              const v2y = next[j].vy ?? -1;

              const relVx = v1x - v2x;
              const relVy = v1y - v2y;
              const impulse = (relVx * nx + relVy * ny) * 1.05;

              if (impulse > 0) {
                next[i].vx = v1x - impulse * nx;
                next[i].vy = v1y - impulse * ny;
                next[j].vx = v2x + impulse * nx;
                next[j].vy = v2y + impulse * ny;
                next[i].isBouncing = true;
                next[j].isBouncing = true;
              }
            }
          }
        }

        return next;
      });

      animFrameRef.current = requestAnimationFrame(stepPhysics);
    };

    animFrameRef.current = requestAnimationFrame(stepPhysics);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isScreensaverMode, viewport.width, viewport.height]);

  // Toggle screensaver mode
  const handleToggleScreensaver = useCallback(() => {
    setIsScreensaverMode((prev) => {
      const next = !prev;
      showToast(
        lang === 'en'
          ? next
            ? '✨ Windows Bubble Screensaver ON (Bouncing)'
            : 'Screensaver Paused'
          : next
          ? '✨ 泡泡屏保模式已开启（经典碰撞漫游）'
          : '已退出泡泡屏保'
      );
      return next;
    });
  }, [lang]);

  // Reset initial arrangement (matching user sketch feature!)
  const handleResetArrangement = useCallback(() => {
    setIsScreensaverMode(false);
    const fresh = getInitialBubbleConfigs(viewport.width, viewport.height);
    setBubbles(fresh);
    showToast(lang === 'en' ? 'Straight 9-Grid Layout Restored' : '已重置为平直九宫格排列');
  }, [viewport.width, viewport.height, lang]);

  // Bring clicked/dragged bubble to top
  const handleBringToFront = useCallback((id: BubbleId) => {
    maxZIndexRef.current += 1;
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, zIndex: maxZIndexRef.current } : b))
    );
  }, []);

  // Update position or size of a bubble
  const handleUpdateConfig = useCallback((id: BubbleId, updated: Partial<BubbleConfig>) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  }, []);

  // Close/hide bubble to reduce total bubble count ("在设置下增加关闭泡泡按钮，减少总泡数，在初始化排列可以全部恢复")
  const handleHideBubble = useCallback((id: BubbleId) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: false } : b))
    );
    showToast(
      lang === 'en'
        ? 'Bubble closed. Click "Reset Layout" to restore all.'
        : '已关闭此泡泡（减少总泡数），点击顶栏“初始化排列”即可全部恢复'
    );
  }, [lang]);

  // User Request: "一键校准斜角重新实现归零水平仪与侧倾仪"
  const handleCalibrateZero = useCallback((customPitch?: number, customRoll?: number) => {
    const orientation = bubbleSettings.spiritLevelOrientation || 'landscape';
    const isSwapped = bubbleSettings.swapSpiritAndTiltParams ?? false;

    // Use current telemetry if not specifically passed
    const pSource = customPitch !== undefined ? customPitch : telemetry.pitchDeg;
    const rSource = customRoll !== undefined ? customRoll : telemetry.rollDeg;

    // 1. Calculate raw base for Spirit Level based on orientation & swap
    let spPitch = orientation === 'landscape' ? pSource : rSource;
    let spRoll = orientation === 'landscape' ? rSource : pSource;
    if (isSwapped) {
      const temp = spPitch;
      spPitch = spRoll;
      spRoll = temp;
    }
    const rawSpPitch = bubbleSettings.spiritLevelInvertPitch ? -spPitch : spPitch;
    const rawSpRoll = bubbleSettings.spiritLevelInvertRoll ? -spRoll : spRoll;

    // 2. Calculate raw base for Tilt Meter
    let tmRoll = orientation === 'landscape' ? rSource : pSource;
    let tmPitch = orientation === 'landscape' ? pSource : rSource;
    if (isSwapped) {
      const temp = tmRoll;
      tmRoll = tmPitch;
      tmPitch = temp;
    }
    const rawTmRoll = bubbleSettings.tiltMeterInvertRoll ? -tmRoll : tmRoll;

    const pOff = Number(rawSpPitch.toFixed(1));
    const rOff = Number(rawSpRoll.toFixed(1));
    const tmOff = Number(rawTmRoll.toFixed(1));

    setBubbleSettings((prev) => ({
      ...prev,
      spirit_level: {
        ...prev.spirit_level,
        pitchOffset: pOff,
        rollOffset: rOff,
      },
      tilt_meter: {
        ...prev.tilt_meter,
        zeroOffset: tmOff,
      },
      spiritLevelPitchOffset: pOff,
      spiritLevelRollOffset: rOff,
      tiltMeterPitchOffset: pOff,
      tiltMeterRollOffset: tmOff,
    }));

    showToast(
      lang === 'en'
        ? `Zero Calibrated: Spirit & Tilt set to 0.0° (P: ${pOff}°, R: ${rOff}°)`
        : `一键校准斜角完成：水平仪与侧倾仪已精准归零 (0.0°)`
    );
  }, [
    telemetry.pitchDeg,
    telemetry.rollDeg,
    bubbleSettings.spiritLevelOrientation,
    bubbleSettings.swapSpiritAndTiltParams,
    bubbleSettings.spiritLevelInvertPitch,
    bubbleSettings.spiritLevelInvertRoll,
    bubbleSettings.tiltMeterInvertRoll,
    lang,
  ]);

  // User Request: "滑动栏增加一键参数归零，清理速度，行驶时间，距离等参数"
  const handleQuickZeroParams = useCallback(() => {
    resetTrip();
    setSimTargetSpeed(0);
    showToast(
      lang === 'en'
        ? 'Trip Parameters Reset: Speed, Driving Time & Distance Cleared to 0'
        : '一键参数归零完成：速度、行驶时间、行驶距离等参数已清理归零'
    );
  }, [resetTrip, setSimTargetSpeed, lang]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 5 Inclinometer and Tilt Meter Swapping & Mode Saving Handlers (用户需求：顶部滑动菜单增加5个按钮)
  const handleToggleSwapSpiritAndTilt = () => {
    setBubbleSettings((prev) => {
      const next = !prev.swapSpiritAndTiltParams;
      showToast(
        lang === 'en'
          ? (next ? 'Spirit Level & Tilt Meter Parameters Swapped' : 'Parameters Reset to Default')
          : (next ? '水平仪与侧倾仪参数已对换' : '水平仪与侧倾仪参数已恢复默认')
      );
      return { ...prev, swapSpiritAndTiltParams: next };
    });
  };

  const handleToggleSpiritLevelInvertRoll = () => {
    setBubbleSettings((prev) => {
      const next = !prev.spiritLevelInvertRoll;
      showToast(
        lang === 'en'
          ? (next ? 'Spirit Level Left/Right Inverted' : 'Spirit Level Left/Right Normal')
          : (next ? '水平仪左右对换（转向图像已对换）' : '水平仪左右恢复正常')
      );
      return { ...prev, spiritLevelInvertRoll: next };
    });
  };

  const handleToggleSpiritLevelInvertPitch = () => {
    setBubbleSettings((prev) => {
      const next = !prev.spiritLevelInvertPitch;
      showToast(
        lang === 'en'
          ? (next ? 'Spirit Level Pitch Inverted' : 'Spirit Level Pitch Normal')
          : (next ? '水平仪俯仰对换已生效' : '水平仪俯仰恢复正常')
      );
      return { ...prev, spiritLevelInvertPitch: next };
    });
  };

  const handleToggleTiltMeterInvertRoll = () => {
    setBubbleSettings((prev) => {
      const next = !prev.tiltMeterInvertRoll;
      showToast(
        lang === 'en'
          ? (next ? 'Tilt Meter Left/Right Inverted' : 'Tilt Meter Left/Right Normal')
          : (next ? '侧倾仪左右对换已生效' : '侧倾仪左右恢复正常')
      );
      return { ...prev, tiltMeterInvertRoll: next };
    });
  };

  const handleSaveInclinometerModes = () => {
    try {
      localStorage.setItem('BUBBLE_HUD_SETTINGS', JSON.stringify(bubbleSettings));
      localStorage.setItem(
        'BUBBLE_HUD_INCLINOMETER_CONFIG',
        JSON.stringify({
          swapSpiritAndTiltParams: bubbleSettings.swapSpiritAndTiltParams,
          spiritLevelInvertRoll: bubbleSettings.spiritLevelInvertRoll,
          spiritLevelInvertPitch: bubbleSettings.spiritLevelInvertPitch,
          tiltMeterInvertRoll: bubbleSettings.tiltMeterInvertRoll,
          spirit_level: bubbleSettings.spirit_level,
          tilt_meter: bubbleSettings.tilt_meter,
        })
      );
      showToast(
        lang === 'en'
          ? '✓ Current Spirit & Tilt Modes Saved to Settings!'
          : '✓ 当前水平仪与侧倾仪模式已成功保存至设置！'
      );
    } catch (err) {
      console.warn('Failed to save settings:', err);
      showToast(lang === 'en' ? 'Error saving settings' : '保存设置失败');
    }
  };

  const activeBubbleConfig = bubbles.find((b) => b.id === activeSettingBubble);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* Top HUD Header */}
      <HUDHeader
        lang={lang}
        onToggleLang={() =>
          setLang((l) => (l === 'dual' ? 'zh' : l === 'zh' ? 'en' : 'dual'))
        }
        isMirrorMode={isMirrorMode}
        onToggleMirror={() => setIsMirrorMode((m) => !m)}
        isScreensaverMode={isScreensaverMode}
        onToggleScreensaver={handleToggleScreensaver}
        isSimulated={isSimulated}
        onToggleSimulated={() => {
          if (isSimulated) {
            setIsPermModalOpen(true);
          } else {
            setIsSimulated(true);
            showToast(lang === 'en' ? 'Switched to Cruise Simulation' : '已切换回模拟巡航模式');
          }
        }}
        simTargetSpeed={simTargetSpeed}
        onChangeSimSpeed={setSimTargetSpeed}
        onResetArrangement={handleResetArrangement}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
        onQuickZeroAll={() => handleCalibrateZero()}
        onQuickZeroParams={handleQuickZeroParams}
        onOpenPermissionsModal={() => setIsPermModalOpen(true)}
        swapSpiritAndTiltParams={bubbleSettings.swapSpiritAndTiltParams}
        onToggleSwapSpiritAndTilt={handleToggleSwapSpiritAndTilt}
        spiritLevelInvertRoll={bubbleSettings.spiritLevelInvertRoll}
        onToggleSpiritLevelInvertRoll={handleToggleSpiritLevelInvertRoll}
        spiritLevelInvertPitch={bubbleSettings.spiritLevelInvertPitch}
        onToggleSpiritLevelInvertPitch={handleToggleSpiritLevelInvertPitch}
        tiltMeterInvertRoll={bubbleSettings.tiltMeterInvertRoll}
        onToggleTiltMeterInvertRoll={handleToggleTiltMeterInvertRoll}
        onSaveInclinometerModes={handleSaveInclinometerModes}
      />

      {/* Sandbox Warning Bar if blocked by iframe preview */}
      {!isSimulated && gpsDiagnostic.status === 'sandbox_blocked' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-fade-in">
          <span>⚠️ 硬件 GPS 被预览沙盒拦截</span>
          <a
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shadow-sm text-[11px]"
          >
            新标签页打开 (直连GPS)
          </a>
        </div>
      )}

      {/* Main HUD Canvas Area (Mirrored if HUD Mirror mode is active for windshield projection) */}
      <main
        id="hud-stage"
        className={`relative flex-1 w-full h-full overflow-hidden transition-transform duration-300 ${
          isMirrorMode ? 'hud-mirror-mode' : ''
        }`}
      >
        {/* Subtle Cockpit Ambient Grid / Starlight Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* 11 Interactive HUD Bubbles */}
        {bubbles.map((config) => {
          if (!config.visible) return null;

          const isGpsDependent = ['speed', 'coords'].includes(config.id);
          const isHardwareLocked = !isSimulated && isGpsDependent && (telemetry.satellitesLocked === 0);

          return (
            <BubbleContainer
              key={config.id}
              config={config}
              viewportWidth={viewport.width}
              viewportHeight={viewport.height}
              isHardwareLocked={isHardwareLocked}
              onUpdateConfig={(updated) => handleUpdateConfig(config.id, updated)}
              onOpenSettings={() => setActiveSettingBubble(config.id)}
              onBringToFront={() => handleBringToFront(config.id)}
            >
              {/* Bubble Content Dispatch */}
              {config.id === 'speed' && (
                <SpeedBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.speed}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}

              {config.id === 'clock' && (
                <ClockBubble
                  settings={bubbleSettings.clock}
                  lang={lang}
                  bubbleSize={config.size}
                  gpsTimestamp={telemetry.gpsTimestamp ?? undefined}
                />
              )}

              {config.id === 'spirit_level' && (
                <SpiritLevelBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.spirit_level}
                  allSettings={bubbleSettings}
                  lang={lang}
                  bubbleSize={config.size}
                  onCalibrateZero={handleCalibrateZero}
                  onOpenCalibration={() => setIsCalibrationModalOpen(true)}
                />
              )}

              {config.id === 'tilt_meter' && (
                <TiltMeterBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.tilt_meter}
                  allSettings={bubbleSettings}
                  lang={lang}
                  bubbleSize={config.size}
                  onCalibrateZero={handleCalibrateZero}
                  onOpenCalibration={() => setIsCalibrationModalOpen(true)}
                />
              )}

              {config.id === 'coords' && (
                <CoordsBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.coords}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}

              {config.id === 'driving_data' && (
                <DrivingDataBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.driving_data}
                  lang={lang}
                  bubbleSize={config.size}
                  onResetTrip={resetTrip}
                />
              )}

              {config.id === 'compass' && (
                <CompassBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.compass}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}

              {config.id === 'weather' && (
                <WeatherBubble
                  telemetry={telemetry}
                  settings={bubbleSettings.weather}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}

              {config.id === 'timer' && (
                <TimerBubble
                  settings={bubbleSettings.timer}
                  lang={lang}
                  bubbleSize={config.size}
                  onUpdateCountdownSeconds={(secs) => {
                    setBubbleSettings((prev) => ({
                      ...prev,
                      timer: { ...prev.timer, countdownSeconds: secs },
                    }));
                  }}
                />
              )}

              {config.id === 'speed_graph' && (
                <CurveGraphBubble
                  type="speed"
                  telemetry={telemetry}
                  speedSettings={bubbleSettings.speed_graph}
                  accelSettings={bubbleSettings.accel_graph}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}

              {config.id === 'accel_graph' && (
                <CurveGraphBubble
                  type="accel"
                  telemetry={telemetry}
                  speedSettings={bubbleSettings.speed_graph}
                  accelSettings={bubbleSettings.accel_graph}
                  lang={lang}
                  bubbleSize={config.size}
                />
              )}
            </BubbleContainer>
          );
        })}
      </main>

      {/* Floating Status Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-sky-950/90 border border-sky-400/50 text-sky-200 text-xs font-mono shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Bubble Parameter Settings Modal */}
      {activeSettingBubble && activeBubbleConfig && (
        <BubbleSettingsModal
          activeBubbleId={activeSettingBubble}
          settings={bubbleSettings}
          bubbleColor={activeBubbleConfig.color}
          lang={lang}
          onUpdateSettings={setBubbleSettings}
          onUpdateColor={(color) => handleUpdateConfig(activeSettingBubble, { color })}
          onClose={() => setActiveSettingBubble(null)}
          onHideBubble={handleHideBubble}
          onOpenCalibration={() => setIsCalibrationModalOpen(true)}
        />
      )}

      {/* Inclinometer / Spirit Level Learning & Calibration Modal */}
      <InclinometerCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        settings={bubbleSettings}
        telemetry={telemetry}
        onUpdateSettings={(newPartial) =>
          setBubbleSettings((prev) => ({ ...prev, ...newPartial }))
        }
      />

      {/* Unified Hardware Permissions Modal */}
      <HardwarePermissionModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        lang={lang}
        onPermissionsGranted={() => {
          setIsSimulated(false);
          setIsPermModalOpen(false);
          showToast(
            lang === 'en'
              ? '🛰️ Live Satellite & Vehicle Sensors Activated'
              : '🛰️ 真实卫星定位与车载体感传感器已连接'
          );
        }}
      />
    </div>
  );
}
