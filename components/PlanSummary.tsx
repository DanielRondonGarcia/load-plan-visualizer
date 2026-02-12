import React, { useState, useEffect } from 'react';
import { LoadPlan } from '../types';
import { getMetricKeys, parseNotes } from '../utils';
import { Edit, X } from 'lucide-react';
import { PhaseEditor } from './PhaseEditor';

interface Props {
  plan: LoadPlan; // Scaled plan for display
  rawPlan: LoadPlan; // Raw plan for editing
  vuScalePercentage: number;
  timeScalePercentage: number;
  onUpdatePhase: (index: number, field: string, value: string | number) => void;
  onAddPhase: () => void;
  onRemovePhase: (index: number) => void;
  onAddMetric: (key: string, label: string) => void;
  onRemoveMetric: (key: string) => void;
}

export const PlanSummary: React.FC<Props> = ({ 
  plan, 
  rawPlan,
  vuScalePercentage,
  timeScalePercentage,
  onUpdatePhase,
  onAddPhase,
  onRemovePhase,
  onAddMetric,
  onRemoveMetric
}) => {
  const metricKeys = getMetricKeys(plan.phases);
  const notesMap = parseNotes(plan.defaults.notes);
  const [showEditor, setShowEditor] = useState(false);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (showEditor) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditor]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mt-6 space-y-8 relative">
      
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800">Plan Configuration Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
           <div>
             <span className="block text-slate-500 text-xs uppercase">Plan Name</span>
             <span className="font-medium">{plan.planName}</span>
           </div>
           <div>
             <span className="block text-slate-500 text-xs uppercase">Version</span>
             <span className="font-medium">{plan.version}</span>
           </div>
           <div>
             <span className="block text-slate-500 text-xs uppercase">Nodes</span>
             <span className="font-medium">{plan.nodes}</span>
           </div>
           <div>
             <span className="block text-slate-500 text-xs uppercase">VU Scale</span>
             <span className="font-medium">{vuScalePercentage}%</span>
           </div>
           <div>
             <span className="block text-slate-500 text-xs uppercase">Time Scale</span>
             <span className="font-medium">{timeScalePercentage}%</span>
           </div>
        </div>
      </div>

      {/* Resources & Defaults */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="font-bold text-slate-700 mb-3 border-l-4 border-blue-500 pl-2">Default Resources</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-xs font-mono border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2">Tool</th>
                            <th className="pb-2">Requests (CPU/Mem)</th>
                            <th className="pb-2">Limits (CPU/Mem)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {Object.entries(plan.resources).map(([tool, config]) => (
                            <tr key={tool}>
                                <td className="py-2 font-bold text-slate-700">{tool}</td>
                                <td className="py-2 text-slate-600">{config.requests.cpu} / {config.requests.memory}</td>
                                <td className="py-2 text-slate-600">{config.limits.cpu} / {config.limits.memory}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div>
            <h3 className="font-bold text-slate-700 mb-3 border-l-4 border-purple-500 pl-2">Configuration Notes</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-xs border border-slate-200 h-full">
                <p className="mb-2"><span className="font-bold text-slate-600">Time Unit:</span> {plan.defaults.timeUnit}</p>
                <div>
                    <span className="font-bold text-slate-600 block mb-1">Metric Definitions:</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        {Object.entries(notesMap).map(([key, val]) => (
                            <li key={key}>
                                <code className="bg-slate-200 px-1 rounded text-slate-800">{key}</code>: {val}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </div>

      {/* Phase Data Table */}
      <div>
        <div className="flex items-center gap-3 mb-3">
             <h3 className="font-bold text-slate-700 border-l-4 border-green-500 pl-2">Phase Execution Data</h3>
             {/* This button has 'hide-on-export' class so it won't appear in the PNG report */}
             <button 
                onClick={() => setShowEditor(true)}
                className="hide-on-export flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-200 transition-colors shadow-sm"
             >
                <Edit size={12} /> Edit Phases
             </button>
        </div>
        
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 border-b border-slate-200 w-12">#</th>
                        <th className="px-4 py-3 border-b border-slate-200">Phase Name</th>
                        <th className="px-4 py-3 border-b border-slate-200">Duration</th>
                        {metricKeys.map(key => (
                            <th key={key} className="px-4 py-3 border-b border-slate-200 text-center">{key}</th>
                        ))}
                        <th className="px-4 py-3 border-b border-slate-200">Description</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {plan.phases.map((phase, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-2 font-medium text-slate-700">{phase.name}</td>
                            <td className="px-4 py-2 text-slate-600">{phase.duration}</td>
                            {metricKeys.map(key => (
                                <td key={key} className="px-4 py-2 text-center text-slate-600 font-mono bg-slate-50/50">
                                    {phase[key] || 0}
                                </td>
                            ))}
                            <td className="px-4 py-2 text-slate-500 text-xs italic">{phase.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL for Editing */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-bold text-slate-800">Edit Phase Configuration</h2>
                    <button 
                        onClick={() => setShowEditor(false)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden bg-slate-50 p-4">
                     {/* We pass rawPlan here so the editor modifies the BASE values, not the scaled ones */}
                     <PhaseEditor 
                        plan={rawPlan} 
                        vuScalePercentage={vuScalePercentage}
                        timeScalePercentage={timeScalePercentage}
                        onUpdatePhase={onUpdatePhase}
                        onAddPhase={onAddPhase}
                        onRemovePhase={onRemovePhase}
                        onAddMetric={onAddMetric}
                        onRemoveMetric={onRemoveMetric}
                     />
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                    <button 
                        onClick={() => setShowEditor(false)}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
