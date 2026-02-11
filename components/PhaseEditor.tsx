import React, { useState } from 'react';
import { LoadPlan } from '../types';
import { getMetricKeys, parseNotes, isValidDuration, parseDuration } from '../utils';
import { Trash2, Plus, X, AlertTriangle } from 'lucide-react';

interface Props {
  plan: LoadPlan;
  scalePercentage?: number;
  onUpdatePhase: (index: number, field: string, value: string | number) => void;
  onAddPhase: () => void;
  onRemovePhase: (index: number) => void;
  onAddMetric: (key: string, label: string) => void;
  onRemoveMetric: (key: string) => void;
}

const MAX_DESC_LENGTH = 100;

export const PhaseEditor: React.FC<Props> = ({ plan, scalePercentage = 100, onUpdatePhase, onAddPhase, onRemovePhase, onAddMetric, onRemoveMetric }) => {
  const metricKeys = getMetricKeys(plan.phases);
  const notesMap = parseNotes(plan.defaults.notes);

  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');

  const handleAddMetricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMetricKey && newMetricLabel) {
      onAddMetric(newMetricKey, newMetricLabel);
      setNewMetricKey('');
      setNewMetricLabel('');
      setIsAddingMetric(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Scenario Phases</h3>
            <div className="flex gap-2">
                <button 
                onClick={() => setIsAddingMetric(!isAddingMetric)}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors border ${isAddingMetric ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                >
                {isAddingMetric ? <X size={14} /> : <Plus size={14} />} 
                {isAddingMetric ? 'Cancel' : 'Add Test Resource'}
                </button>
                <button 
                onClick={onAddPhase}
                className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                <Plus size={14} /> Add Phase
                </button>
            </div>
        </div>

        {scalePercentage !== 100 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-md text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle size={16} />
            <span>
              <strong>Scaling Active ({scalePercentage}%):</strong> You are editing the <strong>Base Plan (100%)</strong> values. Charts and exports reflect the scaled percentage.
            </span>
          </div>
        )}

        {isAddingMetric && (
             <form onSubmit={handleAddMetricSubmit} className="flex flex-col sm:flex-row gap-4 items-end bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Key (e.g., liqCiclo10)</label>
                    <input 
                        type="text" 
                        value={newMetricKey}
                        onChange={(e) => setNewMetricKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="Metric Key"
                        required
                    />
                </div>
                <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Label (e.g., Liquidación 10)</label>
                    <input 
                        type="text" 
                        value={newMetricLabel}
                        onChange={(e) => setNewMetricLabel(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="Display Label"
                        required
                    />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm">
                    Add Column
                </button>
             </form>
        )}
      </div>
      
      <div className="overflow-auto flex-1 p-0">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 w-12 text-center">#</th>
              <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 min-w-[200px]">Phase Name</th>
              <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 w-24 text-center">Duration</th>
              {metricKeys.map(key => (
                <th key={key} className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 w-28 text-center group/th relative">
                  <div className="flex items-center justify-center gap-1">
                      <span>{notesMap[key] || key}</span>
                  </div>
                  <button 
                    onClick={() => onRemoveMetric(key)}
                    className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover/th:opacity-100 hover:bg-red-200 transition-all scale-75"
                    title={`Remove ${key}`}
                  >
                    <X size={12} />
                  </button>
                </th>
              ))}
               <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 min-w-[250px]">Description</th>
              <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plan.phases.map((phase, index) => {
              const isDurationValid = isValidDuration(phase.duration);
              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-2 text-slate-400 font-mono text-xs text-center">
                      {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700 font-medium placeholder-slate-300"
                      value={phase.name}
                      onChange={(e) => onUpdatePhase(index, 'name', e.target.value)}
                      placeholder="Phase Name"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border rounded px-2 py-1 focus:outline-none text-center ${
                        isDurationValid 
                          ? 'border-slate-200 focus:border-blue-400' 
                          : 'border-red-500 focus:border-red-500 bg-red-50 text-red-600 font-medium'
                      }`}
                      title={isDurationValid ? 'Duration (e.g. 1m, 30s)' : 'Invalid format. Use 10m, 30s, 1h.'}
                      value={phase.duration}
                      onChange={(e) => onUpdatePhase(index, 'duration', e.target.value)}
                    />
                  </td>
                  {metricKeys.map(key => (
                    <td key={key} className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 text-center font-mono text-slate-600"
                        value={phase[key] || 0}
                        onChange={(e) => onUpdatePhase(index, key, parseInt(e.target.value) || 0)}
                      />
                    </td>
                  ))}
                   <td className="px-4 py-2 relative group/desc">
                    <input
                      type="text"
                      maxLength={MAX_DESC_LENGTH}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 text-xs truncate pr-12"
                      value={phase.description}
                      title={phase.description}
                      placeholder="Phase description"
                      onChange={(e) => onUpdatePhase(index, 'description', e.target.value)}
                    />
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono pointer-events-none px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                        phase.description.length === 0 
                            ? 'opacity-0' 
                            : phase.description.length >= MAX_DESC_LENGTH 
                                ? 'opacity-100 bg-red-100 text-red-600 font-bold' 
                                : 'opacity-0 group-focus-within/desc:opacity-100 bg-slate-100 text-slate-400'
                    }`}>
                        {phase.description.length}/{MAX_DESC_LENGTH}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button 
                      onClick={() => onRemovePhase(index)}
                      className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       <div className="bg-slate-50 p-2 text-xs text-center text-slate-400 border-t border-slate-200">
        Total Duration: {plan.phases.reduce((acc, p) => acc + (parseDuration(p.duration) || 0), 0).toFixed(2)} min
      </div>
    </div>
  );
};