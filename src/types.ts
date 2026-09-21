export type Language = 'zh' | 'en' | 'dual';

export type HUDTheme = 'fighter-green' | 'amber-glow' | 'cyber-cyan' | 'oled-pure' | 'crimson-speed';

export type BubbleId = 
  | 'speed'
  | 'clock'
  | 'spirit_level'
  | 'tilt_meter'
  | 'coords'
  | 'driving_data'
  | 'compass'
  | 'weather'
  | 'timer'
  | 'speed_graph'
  | 'accel_graph';

export interface BubbleConfig {
  id: BubbleId;
  x: number; // in pixels
  y: number;
  size: number; // diameter in pixels
  visible: boolean;
  color: string; // ring theme color
  zIndex: number;
  vx?: number; // velocity for screensaver floating mode
  vy?: number;
  isBouncing?: boolean;
}

export type ClockStyle = 
  | 'roman' 
  | 'aviator' 
  | 'minimal' 
  | 'cyber' 
  | 'digital'
  | 'breitling_navitimer_white'
  | 'breitling_navitimer_green'
  | 'breitling_chronomat_blue'
  | 'iwc_portugieser';

export interface BubbleSettings {
  speed: {
    unit: 'km/h' | 'mph' | 'm/s';
    maxDisplaySpeed: number;
    overspeedAlert: number;
    showMpsSubtext: boolean;
    style: 'gauge' | 'digital';
  };
  clock: {
    style: ClockStyle;
    is24Hour: boolean;
    showSeconds: boolean;
    showDate: boolean;
    timezoneMode?: 'auto' | 'custom';
    timezoneOffsetHours?: number; // e.g. 8 for UTC+8
    timezoneName?: string; // e.g. "北京时间 (UTC+8)"
  };
  spirit_level: {
    pitchOffset: number; // in degrees, to subtract tablet slant angle!
    rollOffset: number;  // in degrees
    sensitivity: number;
    style: 'fighter_hud' | 'classic_aviation' | 'spherical_gyro';
    screenOrientation?: 'landscape' | 'portrait';
    gainFactorPitch?: number; // learned slope multiplier (default 1.0)
    gainFactorRoll?: number;  // learned roll multiplier (default 1.0)
    useGpsAltitudeSlope?: boolean; // 长时间上下坡参考 GPS 高程坡度数据
  };
  tilt_meter: {
    warningThreshold: number; // e.g. 25 deg
    dangerThreshold: number;  // e.g. 35 deg
    zeroOffset: number;
    screenOrientation?: 'landscape' | 'portrait';
    gainFactorRoll?: number;
    useGpsAltitudeSlope?: boolean;
  };
  coords: {
    format: 'dms' | 'decimal';
    showAltitude: boolean;
  };
  driving_data: {
    distanceUnit: 'km' | 'mi';
    speedUnit: 'km/h' | 'mph';
  };
  compass: {
    spherePerspective: number; // 3D depth
    showDegreeNumber: boolean;
    damping: number;
    // GPS Weighted Estimation / Fusion Mode ("指南针请增加一个GPS信息加权推算模式")
    fusionMode: 'auto_fusion' | 'gps_only' | 'mag_only'; // 智能GPS加权推算, 纯GPS航向, 纯地磁传感器
    gpsWeightMax?: number; // 0.5 to 1.0 (default 0.90), high speed weight for GPS track
    minSpeedKmh?: number;  // min speed threshold to engage GPS weighting (default 5 km/h)
  };
  weather: {
    source: 'gps_auto' | 'custom_city';
    city: string;
    tempUnit: 'C' | 'F' | 'both';
    refreshIntervalMins: number;
  };
  timer: {
    mode: 'stopwatch' | 'countdown';
    countdownSeconds: number;
    soundAlert: boolean;
  };
  speed_graph: {
    timeWindowSec: number; // 30, 60, 120
    maxScale: number;
  };
  accel_graph: {
    timeWindowSec: number;
    maxG: number;
  };

  // Learning & calibration global state for spirit level / inclinometer
  spiritLevelOrientation?: 'landscape' | 'portrait';
  spiritLevelPitchOffset?: number;
  spiritLevelRollOffset?: number;
  spiritLevelGainFactor?: number;
  spiritLevelUseGpsSlope?: boolean;

  tiltMeterOrientation?: 'landscape' | 'portrait';
  tiltMeterPitchOffset?: number;
  tiltMeterRollOffset?: number;
  tiltMeterGainFactor?: number;
  tiltMeterUseGpsSlope?: boolean;
}

export interface TelemetryData {
  // Speed
  speedKmh: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  
  // Acceleration
  accelMps2: number; // m/s^2
  gForce: number;    // g
  
  // Attitude
  pitchDeg: number;  // raw pitch
  rollDeg: number;   // raw roll
  headingDeg: number; // 0-360 (fused/final heading)
  magneticHeadingDeg?: number; // raw device electronic compass heading
  gpsBearingDeg?: number;      // raw GPS track heading (Course-Over-Ground)
  gpsHeadingWeight?: number;   // dynamic GPS weighting ratio (0..1)
  isGpsHeadingActive?: boolean; // whether GPS weighted tracking is actively contributing
  
  // Coordinates & Satellites
  latitude: number;
  longitude: number;
  altitudeM: number;
  satellitesLocked: number;
  satellitesTotal: number;
  gpsAccuracyM: number;
  
  // Trip
  tripDurationSec: number;
  tripDistanceKm: number;
  tripDirectDistanceKm: number;
  
  // Weather
  temperatureC: number;
  weatherConditionZh: string;
  weatherConditionEn: string;
  humidity: number;
  pressureHpa: number;
  weatherLocation: string;
  
  // GPS Time & Altitude Slope
  gpsTimestamp?: number | null;
  gpsSlopeDeg?: number;
  isGpsTimeSynced?: boolean;

  // History for dual-layer curves (short-term 20s & long-term 1 hour)
  speedHistory: { time: number; speedKmh: number }[];
  accelHistory: { time: number; gForce: number }[];
  speedHistoryShort: { time: number; speedKmh: number }[]; // 20s live
  speedHistoryLong: { time: number; speedKmh: number }[];  // 1 hour trend
  accelHistoryShort: { time: number; gForce: number }[];   // 20s live
  accelHistoryLong: { time: number; gForce: number }[];    // 1 hour trend
}
