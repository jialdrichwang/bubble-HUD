import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation, CallbackID } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { TelemetryData } from '../types';
import { isIframeSandbox } from './hardwarePermissions';
import { blendAnglesDeg } from './telemetry';

export interface GpsDiagnostic {
  status: 'idle' | 'searching' | 'active' | 'sandbox_blocked' | 'denied' | 'error';
  message: string;
}

export function useTelemetry(isSimulated = true) {
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => ({
    speedKmh: 68.4,
    maxSpeedKmh: 124.2,
    avgSpeedKmh: 58.7,
    accelMps2: 0.85,
    gForce: 0.09,
    pitchDeg: 2.1,
    rollDeg: -1.4,
    headingDeg: 68.0,
    magneticHeadingDeg: 65.8,
    gpsBearingDeg: 68.0,
    gpsHeadingWeight: 0.90,
    isGpsHeadingActive: true,
    latitude: 30.5872,
    longitude: 114.2936,
    altitudeM: 38.5,
    satellitesLocked: 42,
    satellitesTotal: 58,
    gpsAccuracyM: 2.4,
    tripDurationSec: 5551, // 01:32:31
    tripDistanceKm: 180.4,
    tripDirectDistanceKm: 144.2,
    temperatureC: 22.0,
    weatherConditionZh: '多云',
    weatherConditionEn: 'Partly Cloudy',
    humidity: 58,
    pressureHpa: 1013.2,
    gpsTimestamp: Date.now(),
    weatherLocation: '实时气象站 / Live Station',
    speedHistory: Array.from({ length: 60 }, (_, i) => ({
      time: Date.now() - (60 - i) * 1000,
      speedKmh: 60 + Math.sin(i * 0.2) * 15 + Math.random() * 4,
    })),
    accelHistory: Array.from({ length: 60 }, (_, i) => ({
      time: Date.now() - (60 - i) * 1000,
      gForce: Math.sin(i * 0.3) * 0.18 + (Math.random() - 0.5) * 0.05,
    })),
    speedHistoryShort: Array.from({ length: 40 }, (_, i) => ({
      time: Date.now() - (40 - i) * 500,
      speedKmh: 65 + Math.sin(i * 0.35) * 8 + (Math.random() - 0.5) * 2,
    })),
    accelHistoryShort: Array.from({ length: 40 }, (_, i) => ({
      time: Date.now() - (40 - i) * 500,
      gForce: Math.sin(i * 0.4) * 0.12 + (Math.random() - 0.5) * 0.04,
    })),
    speedHistoryLong: Array.from({ length: 60 }, (_, i) => {
      const progress = i / 60;
      let base = 50;
      if (progress < 0.15) base = 35 + Math.sin(i * 0.8) * 12;
      else if (progress < 0.7) base = 85 + Math.sin(i * 0.3) * 16;
      else if (progress < 0.75) base = 20;
      else base = 90 + Math.sin(i * 0.4) * 10;
      return {
        time: Date.now() - (60 - i) * 60 * 1000,
        speedKmh: Math.max(0, Math.round(base + (Math.random() - 0.5) * 6)),
      };
    }),
    accelHistoryLong: Array.from({ length: 60 }, (_, i) => ({
      time: Date.now() - (60 - i) * 60 * 1000,
      gForce: Number((Math.sin(i * 0.3) * 0.14 + (Math.random() - 0.5) * 0.04).toFixed(2)),
    })),
  }));

  const [simTargetSpeed, setSimTargetSpeed] = useState(85);
  const [gpsDiagnostic, setGpsDiagnostic] = useState<GpsDiagnostic>({
    status: 'idle',
    message: '',
  });

  const tripOriginRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastPosRef = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const lastMagHeadingRef = useRef<number>(65.8);
  const lastGpsBearingRef = useRef<number>(68.0);

  // Simulation tick loop
  useEffect(() => {
    if (!isSimulated) return;

    let simPhase = 0;
    const interval = setInterval(() => {
      simPhase += 0.05;
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setTelemetry((prev) => {
        const speedNoise = Math.sin(simPhase * 1.8) * 4.5 + Math.cos(simPhase * 0.7) * 2;
        const target = Math.max(0, simTargetSpeed + speedNoise);
        const speedDelta = (target - prev.speedKmh) * 0.08;
        const newSpeed = Math.max(0, prev.speedKmh + speedDelta);

        const speedDiffMps = ((newSpeed - prev.speedKmh) * 1000) / 3600;
        const accelMps2 = dt > 0 ? speedDiffMps / Math.max(dt, 0.05) : 0;
        const gForce = accelMps2 / 9.80665;

        // GPS Course-Over-Ground (COG)
        const gpsBearing = (prev.headingDeg + Math.sin(simPhase * 0.4) * 0.45 + 360) % 360;
        // Minor magnetic distortion from car electronics (cabin speakers/motors)
        const magDistortion = Math.sin(simPhase * 0.7) * 4.2 + 2.0;
        const magHeading = (gpsBearing + magDistortion + 360) % 360;

        // GPS Dynamic Weighting:
        // Stationary (< 5 km/h): 0% GPS (magnetic dominates)
        // Moving (> 5 km/h): smoothly scales to 92% GPS track heading to eliminate cabin magnetic distortion
        let gpsWeight = 0;
        if (newSpeed > 5) {
          gpsWeight = Math.min(0.92, ((newSpeed - 5) / 25) * 0.92);
        }
        const fusedHeading = blendAnglesDeg(magHeading, gpsBearing, gpsWeight);

        // Vehicle attitude dynamics: Only oscillate pitch and roll when moving, so zero calibration locks stably at 0.0° when parked
        const simulatedTurnRate = newSpeed > 2 ? Math.sin(simPhase * 0.4) : 0;
        const dynamicRoll = -(simulatedTurnRate * (newSpeed / 30) * 3.5);
        const dynamicPitch = (gForce * 6.0) + (newSpeed > 2 ? Math.sin(simPhase * 0.25) * 3.2 : 0);

        const kmTraveled = (newSpeed / 3600) * dt;
        const newTripDistance = prev.tripDistanceKm + kmTraveled;
        const newDirectDistance = prev.tripDirectDistanceKm + kmTraveled * 0.82;

        const maxSpeed = Math.max(prev.maxSpeedKmh, newSpeed);
        const newAvg = (prev.avgSpeedKmh * 0.99) + (newSpeed * 0.01);

        const headingRad = (fusedHeading * Math.PI) / 180;
        const deltaLat = (kmTraveled / 111.32) * Math.cos(headingRad);
        const deltaLon = (kmTraveled / (111.32 * Math.cos((prev.latitude * Math.PI) / 180))) * Math.sin(headingRad);

        const newSpeedHistory = [...prev.speedHistory.slice(-59), { time: now, speedKmh: newSpeed }];
        const newAccelHistory = [...prev.accelHistory.slice(-59), { time: now, gForce }];
        const newShortSpeed = [...prev.speedHistoryShort.slice(-39), { time: now, speedKmh: newSpeed }];
        const newShortAccel = [...prev.accelHistoryShort.slice(-39), { time: now, gForce }];

        return {
          ...prev,
          speedKmh: Number(newSpeed.toFixed(1)),
          maxSpeedKmh: Number(maxSpeed.toFixed(1)),
          avgSpeedKmh: Number(newAvg.toFixed(1)),
          accelMps2: Number(accelMps2.toFixed(2)),
          gForce: Number(gForce.toFixed(2)),
          pitchDeg: Number(dynamicPitch.toFixed(1)),
          rollDeg: Number(dynamicRoll.toFixed(1)),
          headingDeg: Number(fusedHeading.toFixed(1)),
          magneticHeadingDeg: Number(magHeading.toFixed(1)),
          gpsBearingDeg: Number(gpsBearing.toFixed(1)),
          gpsHeadingWeight: Number(gpsWeight.toFixed(2)),
          isGpsHeadingActive: gpsWeight > 0.05,
          latitude: Number((prev.latitude + deltaLat).toFixed(6)),
          longitude: Number((prev.longitude + deltaLon).toFixed(6)),
          tripDistanceKm: Number(newTripDistance.toFixed(2)),
          tripDirectDistanceKm: Number(newDirectDistance.toFixed(2)),
          tripDurationSec: prev.tripDurationSec + 1,
          gpsTimestamp: now,
          speedHistory: newSpeedHistory,
          accelHistory: newAccelHistory,
          speedHistoryShort: newShortSpeed,
          accelHistoryShort: newShortAccel,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulated, simTargetSpeed]);

  // Real sensor hookups (Native Android GPS via Capacitor + HTML5 Fallback)
  useEffect(() => {
    if (isSimulated) {
      setGpsDiagnostic({ status: 'idle', message: '' });
      return;
    }

    // 切换即重置：从“模拟”切换到“真实硬件”模式，立即清空之前的模拟速度和历史曲线（重置为 0）
    tripOriginRef.current = null;
    lastPosRef.current = null;
    const nowTime = Date.now();
    setTelemetry((prev) => ({
      ...prev,
      speedKmh: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      accelMps2: 0,
      gForce: 0,
      tripDistanceKm: 0,
      tripDirectDistanceKm: 0,
      gpsTimestamp: null,
      speedHistory: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 1000,
        speedKmh: 0,
      })),
      accelHistory: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 1000,
        gForce: 0,
      })),
      speedHistoryShort: Array.from({ length: 40 }, (_, i) => ({
        time: nowTime - (40 - i) * 500,
        speedKmh: 0,
      })),
      accelHistoryShort: Array.from({ length: 40 }, (_, i) => ({
        time: nowTime - (40 - i) * 500,
        gForce: 0,
      })),
      speedHistoryLong: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 60 * 1000,
        speedKmh: 0,
      })),
      accelHistoryLong: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 60 * 1000,
        gForce: 0,
      })),
    }));

    setGpsDiagnostic({
      status: 'searching',
      message: '正在搜索 GPS 卫星信号 / Acquiring GPS fix...',
    });

    const handleGpsCoords = (coords: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      altitude?: number | null;
      speed?: number | null;
      heading?: number | null;
    }, timestamp?: number) => {
      const now = Date.now();
      const gpsTime = timestamp || now;
      const dt = lastPosRef.current ? (now - lastPosRef.current.time) / 1000 : 1;
      const distIncrement = lastPosRef.current
        ? calculateDistanceKm(lastPosRef.current.lat, lastPosRef.current.lon, coords.latitude, coords.longitude)
        : 0;

      // Speed resolution: use direct hardware sensor speed or derive from displacement
      let calculatedSpeed = 0;
      if (coords.speed !== null && coords.speed !== undefined && coords.speed >= 0) {
        calculatedSpeed = coords.speed * 3.6;
      } else if (dt > 0 && distIncrement > 0) {
        calculatedSpeed = (distIncrement / dt) * 3600;
      }

      // Heading resolution: fallback to bearing between GPS points if sensor heading is null
      let calculatedHeading: number | null = coords.heading ?? null;
      if ((calculatedHeading === null || isNaN(calculatedHeading)) && lastPosRef.current && distIncrement > 0.002) {
        calculatedHeading = calculateBearing(
          lastPosRef.current.lat,
          lastPosRef.current.lon,
          coords.latitude,
          coords.longitude
        );
      }
      if (calculatedHeading !== null && !isNaN(calculatedHeading)) {
        lastGpsBearingRef.current = calculatedHeading;
      }

      // Dynamic GPS weighting based on current vehicle speed
      let gpsWeight = 0;
      if (calculatedSpeed > 5 && lastGpsBearingRef.current !== null) {
        gpsWeight = Math.min(0.92, ((calculatedSpeed - 5) / 25) * 0.92);
      }
      const currentMag = lastMagHeadingRef.current;
      const currentGps = lastGpsBearingRef.current ?? currentMag;
      const finalHeading = blendAnglesDeg(currentMag, currentGps, gpsWeight);

      if (!tripOriginRef.current) {
        tripOriginRef.current = { lat: coords.latitude, lon: coords.longitude };
      }
      const directDist = tripOriginRef.current
        ? calculateDistanceKm(tripOriginRef.current.lat, tripOriginRef.current.lon, coords.latitude, coords.longitude)
        : 0;

      lastPosRef.current = { lat: coords.latitude, lon: coords.longitude, time: now };

      setGpsDiagnostic({
        status: 'active',
        message: Capacitor.isNativePlatform()
          ? 'Android 底层原生 GPS 已连接 / Native GPS Locked'
          : '浏览器 GPS 卫星定位已锁定 / GPS Locked',
      });

      setTelemetry((prev) => {
        const newMax = Math.max(prev.maxSpeedKmh, calculatedSpeed);
        const totalDist = prev.tripDistanceKm + distIncrement;
        const speedDiff = ((calculatedSpeed - prev.speedKmh) * 1000) / 3600;
        const accelMps2 = dt > 0 ? speedDiff / dt : 0;
        const gForce = accelMps2 / 9.80665;

        // Estimate satellites based on accuracy
        const acc = coords.accuracy ?? 10;
        const estimatedSats = acc < 5 ? 38 : acc < 15 ? 24 : acc < 30 ? 14 : 7;

        return {
          ...prev,
          speedKmh: Number(calculatedSpeed.toFixed(1)),
          maxSpeedKmh: Number(newMax.toFixed(1)),
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
          altitudeM: Number((coords.altitude ?? prev.altitudeM).toFixed(1)),
          gpsAccuracyM: Number(acc.toFixed(1)),
          satellitesLocked: estimatedSats,
          gpsTimestamp: gpsTime,
          headingDeg: Number(finalHeading.toFixed(1)),
          magneticHeadingDeg: Number(currentMag.toFixed(1)),
          gpsBearingDeg: Number(currentGps.toFixed(1)),
          gpsHeadingWeight: Number(gpsWeight.toFixed(2)),
          isGpsHeadingActive: gpsWeight > 0.05,
          tripDistanceKm: Number(totalDist.toFixed(2)),
          tripDirectDistanceKm: Number(directDist.toFixed(2)),
          accelMps2: Number(accelMps2.toFixed(2)),
          gForce: Number(gForce.toFixed(2)),
          speedHistory: [...prev.speedHistory.slice(-59), { time: now, speedKmh: calculatedSpeed }],
          accelHistory: [...prev.accelHistory.slice(-59), { time: now, gForce }],
          speedHistoryShort: [...prev.speedHistoryShort.slice(-39), { time: now, speedKmh: calculatedSpeed }],
          accelHistoryShort: [...prev.accelHistoryShort.slice(-39), { time: now, gForce }],
        };
      });
    };

    let capWatchId: CallbackID | null = null;
    let webWatchId: number | null = null;

    if (Capacitor.isNativePlatform()) {
      // Direct Native Android Location Service
      Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000,
        },
        (position, err) => {
          if (err) {
            console.warn('Native GPS Error:', err);
            setGpsDiagnostic({
              status: 'error',
              message: `原生 GPS 信号异常: ${err.message || '搜索中'}`,
            });
            return;
          }
          if (position && position.coords) {
            handleGpsCoords(position.coords, position.timestamp);
          }
        }
      ).then((id) => {
        capWatchId = id;
      }).catch((err) => {
        console.warn('Native GPS watch start failed:', err);
        setGpsDiagnostic({
          status: 'error',
          message: '底层原生 GPS 启动失败',
        });
      });
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      // Web / WebView layer with Sandbox Detection
      webWatchId = navigator.geolocation.watchPosition(
        (position) => {
          handleGpsCoords(position.coords, position.timestamp);
        },
        (err) => {
          console.warn('Browser GPS Error:', err.message);
          if (err.code === 1 && isIframeSandbox()) {
            setGpsDiagnostic({
              status: 'sandbox_blocked',
              message: '沙盒环境拦截了定位权限。请点击顶部【在新窗口打开】即可直接获取真实 GPS！',
            });
          } else if (err.code === 1) {
            setGpsDiagnostic({
              status: 'denied',
              message: '定位权限已被拒绝，请在地址栏允许访问位置',
            });
          } else {
            setGpsDiagnostic({
              status: 'error',
              message: 'GPS 正在搜索卫星信号...',
            });
          }
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
      );
    } else {
      setGpsDiagnostic({
        status: 'error',
        message: '当前设备或浏览器不支持 GPS 定位',
      });
    }

    // 2. Device Orientation (Gyroscope / Pitch / Roll)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawMag: number | null = null;
      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        rawMag = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        rawMag = (360 - e.alpha) % 360;
      }

      if (rawMag !== null) {
        lastMagHeadingRef.current = rawMag;
        setTelemetry((prev) => {
          let gpsWeight = 0;
          if (prev.speedKmh > 5 && lastGpsBearingRef.current !== null) {
            gpsWeight = Math.min(0.92, ((prev.speedKmh - 5) / 25) * 0.92);
          }
          const currentGps = lastGpsBearingRef.current ?? rawMag!;
          const finalHeading = blendAnglesDeg(rawMag!, currentGps, gpsWeight);

          return {
            ...prev,
            pitchDeg: e.beta !== null ? Number(e.beta.toFixed(1)) : prev.pitchDeg,
            rollDeg: e.gamma !== null ? Number(e.gamma.toFixed(1)) : prev.rollDeg,
            headingDeg: Number(finalHeading.toFixed(1)),
            magneticHeadingDeg: Number(rawMag!.toFixed(1)),
            gpsBearingDeg: Number(currentGps.toFixed(1)),
            gpsHeadingWeight: Number(gpsWeight.toFixed(2)),
            isGpsHeadingActive: gpsWeight > 0.05,
          };
        });
      } else {
        setTelemetry((prev) => ({
          ...prev,
          pitchDeg: e.beta !== null ? Number(e.beta.toFixed(1)) : prev.pitchDeg,
          rollDeg: e.gamma !== null ? Number(e.gamma.toFixed(1)) : prev.rollDeg,
        }));
      }
    };

    // 3. Device Motion (Accelerometer)
    const handleMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const ax = e.accelerationIncludingGravity.x ?? 0;
        const ay = e.accelerationIncludingGravity.y ?? 0;
        const az = e.accelerationIncludingGravity.z ?? 0;
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        const netG = (mag - 9.80665) / 9.80665;
        setTelemetry((prev) => ({
          ...prev,
          gForce: Number(netG.toFixed(2)),
          accelMps2: Number((netG * 9.80665).toFixed(2)),
        }));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      if (capWatchId !== null) {
        Geolocation.clearWatch({ id: capWatchId });
      }
      if (webWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isSimulated]);

  const resetTrip = useCallback(() => {
    tripOriginRef.current = null;
    lastPosRef.current = null;
    const nowTime = Date.now();
    setTelemetry((prev) => ({
      ...prev,
      speedKmh: 0,
      accelMps2: 0,
      gForce: 0,
      tripDurationSec: 0,
      tripDistanceKm: 0,
      tripDirectDistanceKm: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      speedHistory: [],
      accelHistory: [],
      speedHistoryShort: Array.from({ length: 40 }, (_, i) => ({
        time: nowTime - (40 - i) * 500,
        speedKmh: 0,
      })),
      accelHistoryShort: Array.from({ length: 40 }, (_, i) => ({
        time: nowTime - (40 - i) * 500,
        gForce: 0,
      })),
      speedHistoryLong: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 60 * 1000,
        speedKmh: 0,
      })),
      accelHistoryLong: Array.from({ length: 60 }, (_, i) => ({
        time: nowTime - (60 - i) * 60 * 1000,
        gForce: 0,
      })),
    }));
  }, []);

  return {
    telemetry,
    setTelemetry,
    simTargetSpeed,
    setSimTargetSpeed,
    gpsDiagnostic,
    resetTrip,
  };
}

// Great-circle distance between two coords in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate compass bearing between two coordinates in degrees
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}
