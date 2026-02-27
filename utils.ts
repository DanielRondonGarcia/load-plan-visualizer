import { ChartPoint, LoadPlan, Phase } from "./types";

// Parses "5m" to 5, "1h" to 60, etc. Defaults to minutes if unit missing.
export const parseDuration = (durationStr: string): number => {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+(?:\.\d+)?)(\w*)/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];

  if (unit === 'h') return value * 60;
  if (unit === 's') return value / 60;
  return value; // Default to minutes
};

// Converts minutes back to a short string format (e.g. 0.5 -> 30s, 5 -> 5m)
export const stringifyDuration = (minutes: number): string => {
  if (minutes <= 0) return "0m";
  // If less than 1 minute and not 0, use seconds
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  // Otherwise use minutes, rounded to 2 decimals to avoid long floats
  return `${parseFloat(minutes.toFixed(2))}m`;
};

// Validates time format: 10, 10s, 10m, 10h, 1.5m
export const isValidDuration = (durationStr: string): boolean => {
  if (!durationStr) return false;
  return /^\d+(?:\.\d+)?(s|m|h)?$/.test(durationStr);
};

// Parses "key=Value, key2=Value2" into an object
export const parseNotes = (notes: string): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!notes) return map;
  notes.split(',').forEach(part => {
    const [key, val] = part.split('=').map(s => s.trim());
    if (key && val) {
      map[key] = val;
    }
  });
  return map;
};

// Extracts numerical keys from phases (e.g., conUsu, updUsu)
export const getMetricKeys = (phases: Phase[]): string[] => {
  const keys = new Set<string>();
  const exclude = ['name', 'duration', 'rampUp', 'rampDown', 'description', 'notes'];
  phases.forEach(p => {
    Object.keys(p).forEach(k => {
      if (!exclude.includes(k) && typeof p[k] === 'number') {
        keys.add(k);
      }
    });
  });
  return Array.from(keys);
};

// Transforms the plan phases into a time-series array for Recharts
export const transformPlanToChartData = (plan: LoadPlan): ChartPoint[] => {
  const metricKeys = getMetricKeys(plan.phases);
  const data: ChartPoint[] = [];

  const roundTime = (minutes: number) => parseFloat(minutes.toFixed(4));
  const epsilon = 0.0001;

  const getValuesFromPhase = (phase: Phase): Record<string, number> => {
    const values: Record<string, number> = {};
    metricKeys.forEach(k => {
      values[k] = typeof phase[k] === 'number' ? (phase[k] as number) : 0;
    });
    return values;
  };

  const makeZeroValues = (): Record<string, number> => {
    const values: Record<string, number> = {};
    metricKeys.forEach(k => {
      values[k] = 0;
    });
    return values;
  };

  const addPoint = (time: number, phaseName: string, description: string, values: Record<string, number>, pointType: string, phaseIndex?: number) => {
    const point: ChartPoint = {
      time: roundTime(time),
      formattedTime: formatTime(time),
      phaseName,
      description,
      pointType,
      phaseIndex,
    };
    metricKeys.forEach(k => {
      point[k] = values[k] ?? 0;
    });
    data.push(point);
  };

  let currentTime = 0;
  let currentValues = makeZeroValues();

  addPoint(0, 'Start', 'Start of test', currentValues, 'start');

  const phaseTargets = plan.phases.map(getValuesFromPhase);

  plan.phases.forEach((phase, idx) => {
    const total = parseDuration(phase.duration);
    if (total <= 0) {
      return;
    }

    const rampUp = parseDuration(phase.rampUp || '0m');
    const rampDown = parseDuration(phase.rampDown || '0m');

    const safeRampUp = Math.min(Math.max(0, rampUp), total);
    const safeRampDown = Math.min(Math.max(0, rampDown), Math.max(0, total - safeRampUp));
    const steady = Math.max(0, total - safeRampUp - safeRampDown);

    const target = phaseTargets[idx];
    const nextTarget = idx < phaseTargets.length - 1 ? phaseTargets[idx + 1] : makeZeroValues();

    if (safeRampUp > 0) {
      currentTime += safeRampUp;
      currentValues = target;
      addPoint(currentTime, `${phase.name} (Ramp Up)`, phase.description, currentValues, 'rampUpEnd', idx);
    } else {
      const changed = metricKeys.some(k => (currentValues[k] ?? 0) !== (target[k] ?? 0));
      if (changed) {
        const stepTime = currentTime + epsilon;
        currentValues = target;
        addPoint(stepTime, phase.name, phase.description, currentValues, 'step', idx);
      }
    }

    if (steady > 0) {
      currentTime += steady;
      addPoint(currentTime, phase.name, phase.description, currentValues, 'steadyEnd', idx);
    }

    if (safeRampDown > 0) {
      currentTime += safeRampDown;
      currentValues = nextTarget;
      addPoint(currentTime, `${phase.name} (Ramp Down)`, phase.description, currentValues, 'rampDownEnd', idx);
    } else {
      const expectedEnd = roundTime(currentTime);
      const endTime = roundTime(currentTime + (total - safeRampUp - steady));
      if (endTime > expectedEnd) {
        currentTime = endTime;
        addPoint(currentTime, phase.name, phase.description, currentValues, 'phaseEnd', idx);
      }
    }
  });

  return data;
};

const formatTime = (minutes: number): string => {
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Scales the plan duration and metrics by separate percentages for VU and Time
export const scalePlan = (plan: LoadPlan, vuPercentage: number, timePercentage: number): LoadPlan => {
  if (vuPercentage === 100 && timePercentage === 100) return plan;
  const vuRatio = vuPercentage / 100;
  const timeRatio = timePercentage / 100;

  // We need to determine keys once
  const keysToScale = getMetricKeys(plan.phases);

  const newPhases = plan.phases.map(p => {
    const newPhase = { ...p };
    
    // Scale Duration
    const originalDuration = parseDuration(p.duration);
    const scaledTotalDuration = originalDuration * timeRatio;
    newPhase.duration = stringifyDuration(scaledTotalDuration);

    if (typeof p.rampUp === 'string') {
      const originalRampUp = parseDuration(p.rampUp);
      newPhase.rampUp = stringifyDuration(Math.min(originalRampUp * timeRatio, scaledTotalDuration));
    }

    if (typeof p.rampDown === 'string') {
      const originalRampDown = parseDuration(p.rampDown);
      const scaledRampUp = typeof newPhase.rampUp === 'string' ? parseDuration(newPhase.rampUp) : 0;
      newPhase.rampDown = stringifyDuration(Math.min(originalRampDown * timeRatio, Math.max(0, scaledTotalDuration - scaledRampUp)));
    }

    // Scale Metrics (VUs) - Rounding to nearest integer for realistic VUs
    // Ensure minimum VU is always 1, but preserve zero values
    keysToScale.forEach(key => {
       if (typeof p[key] === 'number') {
         const originalValue = p[key] as number;
         const scaledValue = Math.round(originalValue * vuRatio);
         // Only apply minimum of 1 if the original value was greater than 0
         // This preserves intentional zero values (like disabled tests)
         newPhase[key] = originalValue > 0 ? Math.max(1, scaledValue) : scaledValue;
       }
    });

    return newPhase;
  });

  const newOneOffTests = plan.oneOffTests
    ? Object.fromEntries(
        Object.entries(plan.oneOffTests).map(([name, config]) => {
          const originalStart = parseDuration(config.startAfter);
          const scaledStart = stringifyDuration(originalStart * timeRatio);
          return [name, { ...config, startAfter: scaledStart }];
        })
      )
    : undefined;

  return {
    ...plan,
    planName: `${plan.planName} (VU: ${vuPercentage}%, Time: ${timePercentage}%)`,
    oneOffTests: newOneOffTests ?? plan.oneOffTests,
    phases: newPhases
  };
};
