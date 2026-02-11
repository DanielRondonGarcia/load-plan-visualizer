import React from 'react';
import { LoadPlan } from '../types';
import { Settings, Server, FileJson, Percent } from 'lucide-react';

interface Props {
  plan: LoadPlan;
  scalePercentage: number;
  onScaleChange: (value: number) => void;
  onUpdate: (field: keyof LoadPlan, value: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onExportImage: () => void;
}

export const PlanHeader: React.FC<Props> = ({ 
  plan, 
  scalePercentage,
  onScaleChange,
  onUpdate, 
  onImport, 
  onExportJson, 
  onExportImage 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan Name</label>
          <input
            type="text"
            className="text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full transition-colors"
            value={plan.planName}
            onChange={(e) => onUpdate('planName', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Percent size={10} /> Scale Factor
                </label>
                <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={scalePercentage}
                      onChange={(e) => onScaleChange(parseInt(e.target.value))}
                      className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-bold text-blue-700 w-9 text-right">{scalePercentage}%</span>
                </div>
              </div>
           </div>

           <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

           <div className="relative overflow-hidden">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={onImport}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Import JSON"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors border border-slate-200 h-10 min-h-[40px]">
                    <FileJson size={18} />
                    Import
                </button>
           </div>
           <button 
            onClick={onExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors border border-slate-200 h-10 min-h-[40px]"
           >
              <FileJson size={18} />
              Export JSON
          </button>
           <button 
            onClick={onExportImage}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all h-10 min-h-[40px]"
           >
              <Settings size={18} />
              Export Graph
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Version</label>
          <input
            type="text"
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={plan.version}
            onChange={(e) => onUpdate('version', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
             <Server size={12}/> Nodes
          </label>
          <input
            type="number"
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={plan.nodes}
            onChange={(e) => onUpdate('nodes', e.target.value)}
          />
        </div>
         <div>
          <label className="block text-xs text-slate-500 mb-1">Time Unit</label>
          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600 cursor-not-allowed">
            {plan.defaults.timeUnit}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Total Phases</label>
           <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600">
            {plan.phases.length}
          </div>
        </div>
      </div>
    </div>
  );
};
