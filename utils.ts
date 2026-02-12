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
  const exclude = ['name', 'duration', 'description', 'notes'];
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
  let currentTime = 0;
  const data: ChartPoint[] = [];

  // Add initial point at time 0
  const initialPoint: ChartPoint = {
    time: 0,
    formattedTime: "00:00",
    phaseName: "Start",
    description: "Start of test",
  };
  
  // Find all metric keys
  const metricKeys = getMetricKeys(plan.phases);
  metricKeys.forEach(k => {
    initialPoint[k] = 0;
  });
  data.push(initialPoint);

  plan.phases.forEach((phase) => {
    const duration = parseDuration(phase.duration);
    currentTime += duration;

    const point: ChartPoint = {
      time: parseFloat(currentTime.toFixed(2)),
      formattedTime: formatTime(currentTime),
      phaseName: phase.name,
      description: phase.description,
    };

    metricKeys.forEach(key => {
      // If the phase has the key, use it. Otherwise 0.
      point[key] = (phase[key] as number) || 0;
    });

    data.push(point);
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
    newPhase.duration = stringifyDuration(originalDuration * timeRatio);

    // Scale Metrics (VUs) - Rounding to nearest integer for realistic VUs
    // Ensure minimum VU is always 1
    keysToScale.forEach(key => {
       if (typeof p[key] === 'number') {
         const scaledValue = Math.round((p[key] as number) * vuRatio);
         newPhase[key] = Math.max(1, scaledValue); // Ensure minimum of 1 VU
       }
    });

    return newPhase;
  });

  return {
    ...plan,
    planName: `${plan.planName} (VU: ${vuPercentage}%, Time: ${timePercentage}%)`,
    phases: newPhases
  };
};
