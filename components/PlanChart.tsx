import React, { useMemo, useState, forwardRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Label,
} from 'recharts';
import { LoadPlan, ChartPoint, OneOffTestConfig } from '../types';
import { getMetricKeys, parseDuration, parseNotes, transformPlanToChartData } from '../utils';
import { COLORS } from '../constants';

interface Props {
  plan: LoadPlan;
  metricKey?: string;
  title?: string;
  className?: string;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: ChartPoint }>;
  label?: unknown;
  notesMap: Record<string, string>;
};

const CustomTooltip = ({ active, payload, notesMap }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartPoint;
    const totalVU = payload.reduce((sum, entry) => {
      const raw = entry.value;
      const num = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
      return Number.isFinite(num) ? sum + num : sum;
    }, 0);
    return (
      <div className="relative bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-xl rounded-lg max-w-xs z-[9999] pointer-events-none">
        <p className="font-bold text-slate-800 mb-1">{data.phaseName}</p>
        <p className="text-xs text-slate-500 mb-3">{data.description}</p>
        <div className="text-xs font-mono text-slate-400 mb-2 border-b border-slate-100 pb-2">
          Time: {data.formattedTime} ({data.time}m)
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">Total VU:</span>
          <span className="font-bold font-mono text-slate-900">
            {Number.isInteger(totalVU) ? totalVU : totalVU.toFixed(2)}
          </span>
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => {
             const key = entry.name as string;
             const friendlyName = notesMap[key] || key;
             return (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-slate-600">{friendlyName}:</span>
                </span>
                <span className="font-bold font-mono ml-4 text-slate-800">{entry.value}</span>
              </div>
             );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const PlanChart = forwardRef<HTMLDivElement, Props>(({ plan, metricKey, title, className }, ref) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const data = useMemo(() => transformPlanToChartData(plan), [plan]);
  const allMetricKeys = useMemo(() => getMetricKeys(plan.phases), [plan]);
  const notesMap = useMemo(() => parseNotes(plan.defaults.notes), [plan.defaults.notes]);
  const phaseMarkers = useMemo(() => {
    const lastByPhase = new Map<number, ChartPoint>();
    data.forEach((p) => {
      if (typeof p.phaseIndex === 'number') {
        lastByPhase.set(p.phaseIndex, p);
      }
    });
    return Array.from(lastByPhase.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([phaseIndex, point]) => ({ phaseIndex, point }));
  }, [data]);

  const oneOffMarkers = useMemo(() => {
    const entries = Object.entries(plan.oneOffTests ?? {}) as [string, OneOffTestConfig][];
    const markers = entries
      .filter(([, config]) => config.enabled)
      .map(([name, config]) => ({
        name,
        time: parseDuration(config.startAfter),
        startAfter: config.startAfter,
        mode: config.mode,
        dependsOn: config.dependsOn || [],
      }))
      .filter((m) => m.time > 0)
      .sort((a, b) => a.time - b.time);

    const minSeparationMinutes = 6;
    const laneLastTimes: number[] = [];

    return markers.map((m) => {
      let lane = 0;
      while (laneLastTimes[lane] !== undefined && m.time - laneLastTimes[lane] < minSeparationMinutes) {
        lane += 1;
      }
      laneLastTimes[lane] = m.time;
      return { ...m, lane };
    });
  }, [plan.oneOffTests]);

  // Determine which keys to render: specific one or all
  const targetKeys = metricKey ? [metricKey] : allMetricKeys;
  const highlightKey = hoveredKey ?? selectedKey;
  const orderedTargetKeys = useMemo(() => {
    if (!highlightKey || !targetKeys.includes(highlightKey)) return targetKeys;
    return [...targetKeys.filter(k => k !== highlightKey), highlightKey];
  }, [highlightKey, targetKeys]);
  
  // Determine title
  const chartTitle = title || (metricKey ? (notesMap[metricKey] || metricKey) : "Load Scenarios Overview");
  const selectedLabel = selectedKey ? (notesMap[selectedKey] || selectedKey) : null;
  const oneOffMaxLane = useMemo(() => oneOffMarkers.reduce((max, m) => Math.max(max, m.lane), 0), [oneOffMarkers]);

  const legendItems = useMemo(() => {
    return targetKeys.map((key) => {
      const colorIndex = allMetricKeys.indexOf(key);
      return {
        key,
        color: COLORS[colorIndex % COLORS.length],
        label: notesMap[key] || key,
      };
    });
  }, [allMetricKeys, notesMap, targetKeys]);

  return (
    <div ref={ref} className={`bg-white p-6 rounded-xl shadow-md border border-slate-200 w-full relative ${className || 'h-[500px]'}`}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h3 className="text-lg font-bold text-slate-700 ml-2 truncate" title={chartTitle}>{chartTitle}</h3>
        {selectedLabel && (
          <button
            type="button"
            className="hidden sm:flex items-center gap-2 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200 max-w-[55%] hover:bg-slate-200 transition-colors"
            onClick={() => setSelectedKey(null)}
            title="Click para limpiar selección"
          >
            <span className="font-semibold">Selección:</span>
            <span className="truncate" title={selectedLabel}>{selectedLabel}</span>
          </button>
        )}
      </div>
      {!metricKey && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm mb-2 px-2">
          {legendItems.map((item) => {
            const isSelected = selectedKey === item.key;
            const isHovered = hoveredKey === item.key;
            const isDimmed = !!highlightKey && highlightKey !== item.key;
            return (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setSelectedKey((prev) => (prev === item.key ? null : item.key))}
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all ${
                  isSelected ? 'bg-slate-200 text-slate-900' : (isHovered ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50')
                } ${isDimmed ? 'opacity-35' : ''}`}
                title={isSelected ? `${item.label} (seleccionado)` : `Click para seleccionar: ${item.label}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className={`font-medium ${isHovered ? 'text-base' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 32 + oneOffMaxLane * 12,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
          <XAxis 
            dataKey="time" 
            type="number"
            tickFormatter={(val) => `${val}m`} 
            tickMargin={8}
            height={40}
            stroke="#94a3b8"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Duration (min)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Virtual Users', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
          />
          <Tooltip wrapperStyle={{ zIndex: 9999 }} content={<CustomTooltip notesMap={notesMap} />} />
          
          {orderedTargetKeys.map((key) => {
            // Find index in ALL keys to maintain consistent coloring across charts
            const colorIndex = allMetricKeys.indexOf(key);
            const color = COLORS[colorIndex % COLORS.length];
            const isHighlighted = highlightKey === key;
            const isDimmed = !!highlightKey && highlightKey !== key;

            return (
                <Line
                key={key}
                type="linear"
                dataKey={key}
                stroke={color}
                strokeWidth={isHighlighted ? 4 : 2}
                strokeOpacity={isDimmed ? 0.18 : 1}
                activeDot={{ r: isHighlighted ? 8 : 6, strokeWidth: 0 }}
                dot={false}
                animationDuration={500}
                />
            );
          })}

          {phaseMarkers.map(({ phaseIndex, point }) => (
            <ReferenceDot
              key={`phase-${phaseIndex}`}
              x={point.time}
              y={0}
              r={0}
              label={{ position: 'insideBottom', value: phaseIndex + 1, fill: '#cbd5e1', fontSize: 10 }}
            />
          ))}

          {oneOffMarkers.map((m) => (
            <ReferenceLine
              key={`oneoff-${m.name}`}
              x={m.time}
              stroke="#7c3aed"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ position: 'insideTop', value: m.name, fill: '#ff0000', fontSize: 11, fontWeight: 700, dy: (m.lane * 12) + 8 }}
            />
          ))}

          {oneOffMarkers.map((m) => (
            <ReferenceDot
              key={`oneoff-time-${m.name}`}
              x={m.time}
              y={0}
              r={0}
              label={{ position: 'insideBottom', value: m.startAfter, fill: '#ff0000', fontSize: 10, fontWeight: 700, dy: -6 - (m.lane * 10) }}
            />
          ))}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

PlanChart.displayName = 'PlanChart';
