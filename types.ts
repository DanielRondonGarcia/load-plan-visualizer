export interface ResourceLimit {
  cpu: string;
  memory: string;
}

export interface ResourceConfig {
  requests: ResourceLimit;
  limits: ResourceLimit;
}

export interface Resources {
  [key: string]: ResourceConfig;
}

export interface TestResources {
  [key: string]: {
    [tool: string]: ResourceConfig;
  };
}

export interface Phase {
  name: string;
  duration: string;
  rampUp?: string;
  rampDown?: string;
  description: string;
  [key: string]: string | number; // For dynamic VU keys like conUsu, updUsu, etc.
}

export interface Defaults {
  timeUnit: string;
  notes: string;
}

export interface TestExecutionConfig {
  nodes: number;
}

export interface OneOffTestConfig {
  enabled: boolean;
  mode: string;
  startAfter: string;
  dependsOn: string[];
}

export interface LoadPlan {
  planName: string;
  version: string;
  nodes: string;
  testTool: string;
  defaults: Defaults;
  resources: Resources;
  testResources: TestResources;
  testExecution?: Record<string, TestExecutionConfig>;
  oneOffTests?: Record<string, OneOffTestConfig>;
  phases: Phase[];
}

export interface ChartPoint {
  time: number; // Cumulative time in minutes
  formattedTime: string; // HH:mm or mm string
  phaseName: string;
  description: string;
  pointType?: string;
  phaseIndex?: number;
  [key: string]: number | string;
}
