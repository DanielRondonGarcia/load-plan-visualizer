import React, { useState, useRef, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { PlanHeader } from './components/PlanHeader';
import { PlanChart } from './components/PlanChart';
// PhaseEditor is now imported inside PlanSummary, but we might remove it here or keep it if PlanSummary needs it passed? 
// PlanSummary imports it directly. So we can remove the import if not used, 
// but checking the file content PlanSummary.tsx below, it will import it.
import { PlanSummary } from './components/PlanSummary';
import { LoadPlan, Phase } from './types';
import { INITIAL_PLAN } from './constants';
import { getMetricKeys, parseNotes, scalePlan } from './utils';

function App() {
  const [plan, setPlan] = useState<LoadPlan>(INITIAL_PLAN);
  const [scalePercentage, setScalePercentage] = useState<number>(100);
  
  // Ref for the entire report container (charts + summary)
  const reportRef = useRef<HTMLDivElement>(null);

  // Derived state: Scaled plan for visualization and export
  // The Editor continues to use the raw 'plan' to prevent data loss due to rounding when scaling back and forth
  const scaledPlan = useMemo(() => {
    return scalePlan(plan, scalePercentage);
  }, [plan, scalePercentage]);

  // Memoize keys to render individual charts efficiently
  const metricKeys = useMemo(() => getMetricKeys(plan.phases), [plan.phases]);

  const handleUpdateMeta = (field: keyof LoadPlan, value: string) => {
    setPlan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdatePhase = (index: number, field: string, value: string | number) => {
    setPlan((prev) => {
      const newPhases = [...prev.phases];
      newPhases[index] = {
        ...newPhases[index],
        [field]: value,
      };
      return { ...prev, phases: newPhases };
    });
  };

  const handleAddPhase = () => {
    setPlan((prev) => {
      const currentKeys = getMetricKeys(prev.phases);
      const newPhase: Phase = {
        name: `Phase ${prev.phases.length + 1}`,
        duration: '1m',
        description: 'New phase',
      };
      // Init metrics to 0
      currentKeys.forEach(k => newPhase[k] = 0);
      return {
        ...prev,
        phases: [...prev.phases, newPhase]
      };
    });
  };

  const handleRemovePhase = (index: number) => {
    if (plan.phases.length <= 1) return; // Prevent deleting last phase
    setPlan(prev => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index)
    }));
  };

  const handleAddMetric = (key: string, label: string) => {
    if (!key || !label) return;
    if (getMetricKeys(plan.phases).includes(key)) {
        alert(`Metric '${key}' already exists.`);
        return;
    }

    setPlan((prev) => {
        const notesMap = parseNotes(prev.defaults.notes);
        notesMap[key] = label;
        const newNotes = Object.entries(notesMap)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ');

        const newPhases = prev.phases.map(p => ({
            ...p,
            [key]: 0
        }));

        return {
            ...prev,
            defaults: { ...prev.defaults, notes: newNotes },
            phases: newPhases
        };
    });
  };

  const handleRemoveMetric = (key: string) => {
     if (!window.confirm(`Remove metric '${key}' from all phases?`)) return;

     setPlan((prev) => {
         const notesMap = parseNotes(prev.defaults.notes);
         delete notesMap[key];
         const newNotes = Object.entries(notesMap)
             .map(([k, v]) => `${k}=${v}`)
             .join(', ');

         const newPhases = prev.phases.map(p => {
             const newPhase = { ...p };
             delete newPhase[key];
             return newPhase;
         });

         return {
             ...prev,
             defaults: { ...prev.defaults, notes: newNotes },
             phases: newPhases
         };
     });
  };

  const handleExportJson = () => {
    // Export the SCALED plan, not the raw one
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scaledPlan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `load-plan-${scalePercentage}pct-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation could go here
        if (json.phases && Array.isArray(json.phases)) {
            setPlan(json);
            setScalePercentage(100); // Reset scale on import
        } else {
            alert("Invalid JSON format: missing 'phases' array.");
        }
      } catch (err) {
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleExportImage = useCallback(() => {
    if (reportRef.current === null) {
      return;
    }

    // Capture the entire report container
    toPng(reportRef.current, { 
      cacheBust: true, 
      backgroundColor: '#f8fafc', 
      pixelRatio: 2,
      filter: (node) => {
        // Exclude elements with 'hide-on-export' class
        return !node.classList?.contains('hide-on-export');
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `load-plan-report-${scalePercentage}pct-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error generating image', err);
      });
  }, [reportRef, scalePercentage]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Load Plan Designer</h1>
            <p className="text-slate-500 mt-1">Visualice y edite sus escenarios de pruebas de rendimiento</p>
        </header>

        <PlanHeader 
          plan={plan} 
          scalePercentage={scalePercentage}
          onScaleChange={setScalePercentage}
          onUpdate={handleUpdateMeta} 
          onImport={handleImportJson}
          onExportJson={handleExportJson}
          onExportImage={handleExportImage}
        />

        <div className="grid grid-cols-1 gap-6">
          <section className="space-y-6">
            
            {/* REPORT CONTAINER: This section gets captured by the Export Image function */}
            <div ref={reportRef} className="space-y-6 bg-slate-50 p-4 rounded-xl">
              
              {/* Header for Report Snapshot (Visible but unstyled in app, styled in export) */}
              <div className="text-center pb-4 border-b border-slate-200 lg:hidden block">
                 <h2 className="text-2xl font-bold text-slate-800">{scaledPlan.planName}</h2>
                 <p className="text-slate-500 text-sm">Generated Report - {new Date().toLocaleDateString()}</p>
              </div>

              {/* Main Consolidated Chart - Uses SCALED plan */}
              <PlanChart 
                plan={scaledPlan} 
                title={scalePercentage < 100 ? `Load Scenarios Overview (Scaled ${scalePercentage}%)` : undefined}
              />

              {/* Individual Charts Grid - Uses SCALED plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {metricKeys.map((key) => (
                      <PlanChart 
                          key={key} 
                          plan={scaledPlan} 
                          metricKey={key}
                          className="h-[300px]"
                          title={`${parseNotes(plan.defaults.notes)[key] || key} (Scaled ${scalePercentage}%)`}
                      />
                  ))}
              </div>

              {/* Read-Only Data Summary & Editor Modal Trigger */}
              <PlanSummary 
                plan={scaledPlan} 
                rawPlan={plan}
                scalePercentage={scalePercentage} 
                onUpdatePhase={handleUpdatePhase}
                onAddPhase={handleAddPhase}
                onRemovePhase={handleRemovePhase}
                onAddMetric={handleAddMetric}
                onRemoveMetric={handleRemoveMetric}
              />
            </div>
          
          </section>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm pb-8">
          <p>Load Plan Designer v1.0 &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
