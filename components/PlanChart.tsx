import React, { useMemo, forwardRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  ReferenceDot,
} from 'recharts';
import { LoadPlan, ChartPoint } from '../types';
import { getMetricKeys, parseNotes, transformPlanToChartData } from '../utils';
import { COLORS } from '../constants';

interface Props {
  plan: LoadPlan;
  metricKey?: string;
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label, notesMap }: TooltipProps<number, string> & { notesMap: Record<string, string> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartPoint;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-xl rounded-lg max-w-xs z-50">
        <p className="font-bold text-slate-800 mb-1">{data.phaseName}</p>
        <p className="text-xs text-slate-500 mb-3">{data.description}</p>
        <div className="text-xs font-mono text-slate-400 mb-2 border-b border-slate-100 pb-2">
          Time: {data.formattedTime} ({data.time}m)
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
  const data = useMemo(() => transformPlanToChartData(plan), [plan]);
  const allMetricKeys = useMemo(() => getMetricKeys(plan.phases), [plan]);
  const notesMap = useMemo(() => parseNotes(plan.defaults.notes), [plan.defaults.notes]);

  // Determine which keys to render: specific one or all
  const targetKeys = metricKey ? [metricKey] : allMetricKeys;
  
  // Determine title
  const chartTitle = title || (metricKey ? (notesMap[metricKey] || metricKey) : "Load Scenarios Overview");

  return (
    <div ref={ref} className={`bg-white p-6 rounded-xl shadow-md border border-slate-200 w-full relative ${className || 'h-[500px]'}`}>
      <h3 className="text-lg font-bold text-slate-700 mb-4 ml-2 truncate" title={chartTitle}>{chartTitle}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
          <XAxis 
            dataKey="time" 
            type="number"
            tickFormatter={(val) => `${val}m`} 
            stroke="#94a3b8"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Duration (min)', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Virtual Users', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
          />
          <Tooltip content={<CustomTooltip notesMap={notesMap} />} />
          {!metricKey && (
            <Legend 
              verticalAlign="top" 
              height={36} 
              formatter={(value) => <span className="text-slate-600 font-medium ml-1 mr-4">{notesMap[value] || value}</span>}
            />
          )}
          
          {targetKeys.map((key) => {
            // Find index in ALL keys to maintain consistent coloring across charts
            const colorIndex = allMetricKeys.indexOf(key);
            const color = COLORS[colorIndex % COLORS.length];

            return (
                <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0 }}
                dot={{ r: 3, strokeWidth: 0, fill: color }}
                animationDuration={500}
                />
            );
          })}

          {/* Add markers for phases */}
          {data.map((point, i) => (
             i > 0 && <ReferenceDot key={i} x={point.time} y={0} r={0} label={{ position: 'insideBottom', value: i, fill: '#cbd5e1', fontSize: 10 }} />
          ))}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

PlanChart.displayName = 'PlanChart';
