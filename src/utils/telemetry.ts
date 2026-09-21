import { BubbleConfig, BubbleId, BubbleSettings, TelemetryData } from '../types';

export const DEFAULT_BUBBLE_SETTINGS: BubbleSettings = {
  speed: {
    unit: 'km/h',
    maxDisplaySpeed: 200,
    overspeedAlert: 120,
    showMpsSubtext: true,
    style: 'gauge',
  },
  clock: {
    style: 'roman',
    is24Hour: true,
    showSeconds: true,
    showDate: true,
    timezoneMode: 'auto',
    timezoneOffsetHours: typeof window !== 'undefined' ? -new Date().getTimezoneOffset() / 60 : 8,
    timezoneName: '本地时区 (Local)',
  },
  spirit_level: {
    pitchOffset: 25, // default slanted tablet offset in car mount (e.g. 25°)
    rollOffset: 0,
    sensitivity: 1.0,
    style: 'spherical_gyro', // Default to uploaded spherical gyro style!
    screenOrientation: 'landscape',
    gainFactorPitch: 1.0,
    gainFactorRoll: 1.0,
    useGpsAltitudeSlope: true,
  },
  tilt_meter: {
    warningThreshold: 25,
    dangerThreshold: 35,
    zeroOffset: 0,
    screenOrientation: 'landscape',
    gainFactorRoll: 1.0,
    useGpsAltitudeSlope: true,
  },
  coords: {
    format: 'dms',
    showAltitude: true,
  },
  driving_data: {
    distanceUnit: 'km',
    speedUnit: 'km/h',
  },
  compass: {
    spherePerspective: 500,
    showDegreeNumber: true,
    damping: 0.8,
    // GPS Weighted Estimation / Fusion Mode (default: auto_fusion with dynamic speed weighting)
    fusionMode: 'auto_fusion',
    gpsWeightMax: 0.90, // up to 90% GPS weight when moving at highway speeds
    minSpeedKmh: 5.0,   // start blending GPS heading above 5 km/h
  },
  weather: {
    source: 'gps_auto',
    city: '当前定位 / Current GPS',
    tempUnit: 'both',
    refreshIntervalMins: 15,
  },
  timer: {
    mode: 'stopwatch',
    countdownSeconds: 300,
    soundAlert: true,
  },
  speed_graph: {
    timeWindowSec: 60,
    maxScale: 180,
  },
  accel_graph: {
    timeWindowSec: 60,
    maxG: 1.5,
  },
};

export function getInitialBubbleConfigs(containerWidth: number, containerHeight: number): BubbleConfig[] {
  const headerHeight = 56;
  const isLandscape = containerWidth >= containerHeight;
  
  // All 11 bubbles defined in logical ordering
  const bubbleDefs: { id: BubbleId; color: string; zIndex: number }[] = [
    { id: 'speed', color: '#0ea5e9', zIndex: 10 },
    { id: 'clock', color: '#ef4444', zIndex: 9 },
    { id: 'spirit_level', color: '#a855f7', zIndex: 11 },
    { id: 'tilt_meter', color: '#f43f5e', zIndex: 8 },
    { id: 'coords', color: '#d97706', zIndex: 7 },
    { id: 'driving_data', color: '#06b6d4', zIndex: 10 },
    { id: 'compass', color: '#10b981', zIndex: 12 },
    { id: 'weather', color: '#84cc16', zIndex: 6 },
    { id: 'timer', color: '#3b82f6', zIndex: 5 },
    { id: 'speed_graph', color: '#ec4899', zIndex: 6 },
    { id: 'accel_graph', color: '#f97316', zIndex: 6 },
  ];

  if (isLandscape) {
    // 4 columns x 3 rows straight grid (九宫格延伸排列)
    // Row 0: 4 items, Row 1: 4 items, Row 2: 3 items centered
    const cols = 4;
    const rows = 3;
    const padX = Math.max(16, containerWidth * 0.03);
    const padY = Math.max(12, (containerHeight - headerHeight) * 0.03);
    const availW = containerWidth - padX * 2;
    const availH = containerHeight - headerHeight - padY * 2;

    const cellW = availW / cols;
    const cellH = availH / rows;

    // Symmetrical, uniform diameter for all bubbles, capped within tablet boundary
    const baseSize = Math.max(130, Math.min(Math.floor(Math.min(cellW * 0.88, cellH * 0.88)), Math.floor((containerHeight - headerHeight) * 0.4)));

    // Generate velocity vectors in different directions for screensaver mode
    const velocities = [
      { vx: 0.9, vy: 0.6 },
      { vx: -0.8, vy: 0.7 },
      { vx: 0.7, vy: -0.9 },
      { vx: -0.6, vy: -0.8 },
      { vx: 0.85, vy: -0.5 },
      { vx: -0.75, vy: 0.85 },
      { vx: 0.65, vy: 0.75 },
      { vx: -0.9, vy: -0.65 },
      { vx: 0.7, vy: -0.7 },
      { vx: -0.8, vy: 0.6 },
      { vx: 0.6, vy: 0.8 },
    ];

    return bubbleDefs.map((b, index) => {
      const r = Math.floor(index / cols);
      const c = index % cols;

      let x: number;
      if (r === 2) {
        // Last row has 3 items: center them evenly across the 4 columns
        const row3Pad = (availW - 3 * cellW) / 2;
        x = padX + row3Pad + (index - 8) * cellW + (cellW - baseSize) / 2;
      } else {
        x = padX + c * cellW + (cellW - baseSize) / 2;
      }

      const y = headerHeight + padY + r * cellH + (cellH - baseSize) / 2;

      return {
        id: b.id,
        x: Math.round(x),
        y: Math.round(y),
        size: baseSize, // Exactly identical starting size!
        visible: true,
        color: b.color,
        zIndex: b.zIndex,
        vx: velocities[index].vx,
        vy: velocities[index].vy,
      };
    });
  } else {
    // Portrait: 3 columns x 4 rows straight grid (九宫格排列)
    const cols = 3;
    const rows = 4;
    const padX = Math.max(12, containerWidth * 0.03);
    const padY = Math.max(10, (containerHeight - headerHeight) * 0.02);
    const availW = containerWidth - padX * 2;
    const availH = containerHeight - headerHeight - padY * 2;

    const cellW = availW / cols;
    const cellH = availH / rows;

    const baseSize = Math.max(115, Math.min(Math.floor(Math.min(cellW * 0.9, cellH * 0.9)), 190));

    const velocities = [
      { vx: 0.8, vy: 0.6 },
      { vx: -0.7, vy: 0.7 },
      { vx: 0.7, vy: -0.8 },
      { vx: -0.6, vy: -0.7 },
      { vx: 0.75, vy: -0.5 },
      { vx: -0.65, vy: 0.75 },
      { vx: 0.6, vy: 0.7 },
      { vx: -0.8, vy: -0.6 },
      { vx: 0.65, vy: -0.65 },
      { vx: -0.7, vy: 0.6 },
      { vx: 0.55, vy: 0.75 },
    ];

    return bubbleDefs.map((b, index) => {
      const r = Math.floor(index / cols);
      const c = index % cols;

      let x: number;
      if (r === 3) {
        // Last row has 2 items: center them across the 3 columns
        const row4Pad = (availW - 2 * cellW) / 2;
        x = padX + row4Pad + (index - 9) * cellW + (cellW - baseSize) / 2;
      } else {
        x = padX + c * cellW + (cellW - baseSize) / 2;
      }

      const y = headerHeight + padY + r * cellH + (cellH - baseSize) / 2;

      return {
        id: b.id,
        x: Math.round(x),
        y: Math.round(y),
        size: baseSize, // Exactly identical starting size!
        visible: true,
        color: b.color,
        zIndex: b.zIndex,
        vx: velocities[index].vx,
        vy: velocities[index].vy,
      };
    });
  }
}

// Convert decimal degrees to DMS format (e.g. 30° 35' 12'' N)
export function toDMS(coordinate: number, isLatitude: boolean): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  let direction = '';
  if (isLatitude) {
    direction = coordinate >= 0 ? 'N' : 'S';
  } else {
    direction = coordinate >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${minutes}' ${seconds}'' ${direction}`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimerMs(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

/**
 * Circular weighted average of two angles in degrees (0..360)
 * Uses atan2(w1*sin(a1) + w2*sin(a2), w1*cos(a1) + w2*cos(a2))
 * completely avoiding discontinuity at 0°/360°.
 * @param angle1 Base angle (e.g. magnetic compass heading)
 * @param angle2 Target angle (e.g. GPS track bearing)
 * @param weight2 Weight of angle2 (0..1), weight of angle1 will be (1 - weight2)
 */
export function blendAnglesDeg(angle1: number, angle2: number, weight2: number): number {
  const clampWeight = Math.max(0, Math.min(1, weight2));
  if (clampWeight <= 0.001) return (angle1 % 360 + 360) % 360;
  if (clampWeight >= 0.999) return (angle2 % 360 + 360) % 360;

  const rad1 = (angle1 * Math.PI) / 180;
  const rad2 = (angle2 * Math.PI) / 180;

  const w1 = 1 - clampWeight;
  const w2 = clampWeight;

  const x = w1 * Math.cos(rad1) + w2 * Math.cos(rad2);
  const y = w1 * Math.sin(rad1) + w2 * Math.sin(rad2);

  const blendedRad = Math.atan2(y, x);
  let blendedDeg = (blendedRad * 180) / Math.PI;
  if (blendedDeg < 0) blendedDeg += 360;
  return blendedDeg;
}

