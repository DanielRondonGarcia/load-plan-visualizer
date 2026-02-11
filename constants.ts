import { LoadPlan } from "./types";

export const COLORS = [
  "#2563eb", // Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#d97706", // Amber
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#db2777", // Pink
  "#4b5563", // Gray
];

export const INITIAL_PLAN: LoadPlan = {
  "planName": "Plan de Pruebas de Carga - Escenario Completo 105 min",
  "version": "1.0",
  "nodes": "8",
  "testTool": " ",
  "defaults": {
    "timeUnit": "m",
    "notes": "conUsu=Consultas, updUsu=Modificaciones, recSw=SW Recaudos, proOrden=Procesos de Ordenes de Servicio, liqCiclo9=Liquidación de Ciclo 9"
  },
  "resources": {
    "jmeter": { "requests": { "cpu": "500m", "memory": "1Gi" }, "limits": { "cpu": "660m", "memory": "4Gi" }},
    "k6": { "requests": { "cpu": "4", "memory": "6Gi" }, "limits": { "cpu": "6", "memory": "8Gi" } }
  },
  "testResources": {
    "proOrden": {
      "k6": { "requests": { "cpu": "4", "memory": "6Gi" }, "limits": { "cpu": "6", "memory": "8Gi" } }
    },
    "liqCiclo9": {
      "jmeter": { "requests": { "cpu": "250m", "memory": "512mi" }, "limits": { "cpu": "500m", "memory": "1Gi" } }
    }
  },
  "phases": [
    {"name": "01 - Inicio y Calentamiento",                 "duration": "1m","conUsu": 25    ,"updUsu": 25, "recSw": 0,"proOrden": 25, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Ramp-up inicial de 0 a 40 usuarios."},
    {"name": "02 - Meseta Base",                            "duration": "1m","conUsu": 25    ,"updUsu": 25, "recSw": 0,"proOrden": 25, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Estabilización en carga base."},
    {"name": "03 - Incremento a Carga Proyectada",          "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Subida progresiva hasta el pico máximo operativo."},
    {"name": "04 - Pico Maximo Estable 1",                  "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Sostenimiento de la carga máxima."},
    {"name": "05 - Descenso Intermedio",                    "duration": "1m","conUsu": 40    ,"updUsu": 40, "recSw": 0,"proOrden": 40, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Bajada controlada a carga media."},
    {"name": "06 - Recuperacion a Pico",                    "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Recuperación rápida hacia carga máxima."},
    {"name": "07 - Pico Maximo Estable 2",                  "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Segunda meseta de carga máxima."},
    {"name": "08 - Valle Rapido (V)",                       "duration": "1m","conUsu": 40    ,"updUsu": 40, "recSw": 0,"proOrden": 40, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Caída rápida a 40 VUs (Minuto 40-43)."},
    {"name": "09 - Recuperacion Rapida (V)",                "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Recuperación inmediata a 60 VUs (Minuto 43-45)."},
    {"name": "10 - Carga Maxima + Batch Recaudos",          "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 5,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Concurrencia con SW Recaudos (10 VUs)."},
    {"name": "11 - Carga Maxima + Batch Recaudos 2",        "duration": "1m","conUsu": 0     ,"updUsu": 0,  "recSw": 5,"proOrden": 0,  "liqCiclo9": 1,"liqCiclo8": 0,"description": "Concurrencia con SW Recaudos (10 VUs)."},
    {"name": "12 - Descenso a Valle",                       "duration": "1m","conUsu": 66    ,"updUsu": 66, "recSw": 0,"proOrden": 66, "liqCiclo9": 0,"liqCiclo8": 1,"description": "Bajada drástica de usuarios para permitir procesos batch."},
    {"name": "13 - Valle Operativo (Inicio Liquidacion)",   "duration": "1m","conUsu": 66    ,"updUsu": 66, "recSw": 0,"proOrden": 66, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Usuarios bajos. Inicio de Proc. Liquidación (Ciclos 1 y 2) y Revisiones."},
    {"name": "14 - Incremento Final (Concurrencia Critica)","duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 5,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Subida a Maximo mientras corren Ciclos 1, 2, 3 y Revisiones."},
    {"name": "15 - Stress Maximo (Ciclos + Estadisticas)",  "duration": "1m","conUsu": 60    ,"updUsu": 60, "recSw": 5,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Pico de estrés: Usuarios Max + Recaudos + Ciclos + Estadísticas."},
    {"name": "16 - Soak Testing Final (Cierre Ciclos)",     "duration": "4m","conUsu": 60    ,"updUsu": 60, "recSw": 0,"proOrden": 60, "liqCiclo9": 0,"liqCiclo8": 0,"description": "Mantener carga alta hasta finalizar Ciclos 3 y 4 (Minuto 80-66)."},
    {"name": "17 - Cooldown / Finalizacion",                "duration": "1m","conUsu": 0     ,"updUsu": 0,  "recSw": 0,"proOrden": 0,   "liqCiclo9": 0,"liqCiclo8": 0,"description": "Bajada a 0 y fin de la prueba."}
  ]
};