import { SimulationTemplate } from '../templates/types.js';

// System Analysis Types
export interface SystemAnalysis {
  entities: EntityDefinition[];
  processes: ProcessDefinition[];
  relationships: RelationshipDefinition[];
  constraints: ConstraintDefinition[];
  systemType: SystemType;
  complexity: ComplexityLevel;
  recommendedTemplate: string;
}

export interface EntityDefinition {
  name: string;
  description: string;
  attributes: AttributeDefinition[];
  role: EntityRole;
}

export interface AttributeDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  optional?: boolean;
  description?: string;
}

export interface ProcessDefinition {
  name: string;
  description: string;
  trigger: string;
  steps: ProcessStep[];
  outcomes: string[];
}

export interface ProcessStep {
  name: string;
  description: string;
  duration?: string;
  conditions?: string[];
}

export interface RelationshipDefinition {
  from: string;
  to: string;
  type: RelationshipType;
  description: string;
}

export interface ConstraintDefinition {
  type: ConstraintType;
  description: string;
  enforcementLevel: 'strict' | 'warning' | 'informational';
}

export enum EntityRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary', 
  EXTERNAL = 'external',
  SYSTEM = 'system'
}

export enum RelationshipType {
  ONE_TO_ONE = 'one-to-one',
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_MANY = 'many-to-many',
  DEPENDENCY = 'dependency',
  COMPOSITION = 'composition'
}

export enum ConstraintType {
  BUSINESS_RULE = 'business-rule',
  TECHNICAL = 'technical',
  TEMPORAL = 'temporal',
  SECURITY = 'security',
  COMPLIANCE = 'compliance'
}

export enum SystemType {
  BUSINESS_PROCESS = 'business-process',
  WORKFLOW = 'workflow',
  GAME = 'game',
  IOT_SYSTEM = 'iot-system',
  NETWORK = 'network',
  FINANCIAL = 'financial',
  HEALTHCARE = 'healthcare',
  LOGISTICS = 'logistics',
  GENERIC = 'generic'
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very-complex'
}

// State Design Types
export interface StateDesign {
  states: StateDefinition[];
  transitions: TransitionDefinition[];
  initialState: string;
  finalStates: string[];
  stateGroups?: StateGroupDefinition[];
}

export interface StateDefinition {
  name: string;
  description: string;
  type: StateType;
  properties: StateProperty[];
  validationRules?: ValidationRule[];
  entryActions?: string[];
  exitActions?: string[];
}

export interface StateProperty {
  name: string;
  type: string;
  defaultValue?: any;
  description?: string;
}

export interface TransitionDefinition {
  from: string;
  to: string;
  trigger: string;
  conditions?: string[];
  actions?: string[];
  probability?: number;
}

export interface StateGroupDefinition {
  name: string;
  states: string[];
  description: string;
}

export interface ValidationRule {
  property: string;
  rule: string;
  errorMessage: string;
}

export enum StateType {
  INITIAL = 'initial',
  INTERMEDIATE = 'intermediate', 
  FINAL = 'final',
  ERROR = 'error',
  WAITING = 'waiting',
  PROCESSING = 'processing'
}

// Event Design Types
export interface EventDesign {
  eventTypes: EventTypeDefinition[];
  eventGenerators: EventGeneratorDefinition[];
  eventHandlers: EventHandlerDefinition[];
  eventFlows: EventFlowDefinition[];
}

export interface EventTypeDefinition {
  name: string;
  description: string;
  category: EventCategory;
  payload: PayloadDefinition[];
  frequency: EventFrequency;
  priority: EventPriority;
  triggers: string[];
}

export interface PayloadDefinition {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
  validation?: ValidationRule;
}

export interface EventGeneratorDefinition {
  eventType: string;
  generationLogic: GenerationLogic;
  constraints: GenerationConstraint[];
  dependencies?: string[];
}

export interface GenerationLogic {
  type: 'random' | 'scheduled' | 'triggered' | 'conditional';
  parameters: Record<string, any>;
}

export interface GenerationConstraint {
  type: string;
  value: any;
  description?: string;
}

export interface EventHandlerDefinition {
  eventType: string;
  handlerName: string;
  actions: HandlerAction[];
  stateTransitions: string[];
}

export interface HandlerAction {
  type: 'updateState' | 'generateEvent' | 'logMessage' | 'validateData' | 'custom';
  parameters: Record<string, any>;
}

export interface EventFlowDefinition {
  name: string;
  description: string;
  startEvent: string;
  endEvent: string;
  steps: EventFlowStep[];
}

export interface EventFlowStep {
  eventType: string;
  conditions?: string[];
  nextSteps: string[];
}

export enum EventCategory {
  USER_ACTION = 'user-action',
  SYSTEM = 'system',
  EXTERNAL = 'external',
  TIMER = 'timer',
  ERROR = 'error',
  NOTIFICATION = 'notification'
}

export enum EventFrequency {
  VERY_RARE = 'very-rare',
  RARE = 'rare',
  OCCASIONAL = 'occasional',
  FREQUENT = 'frequent',
  VERY_FREQUENT = 'very-frequent'
}

export enum EventPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Generation Request/Result Types
export interface GenerationRequest {
  description: string;
  template: SimulationTemplate;
  simulationName: string;
  outputDir: string;
  config: any;
  dryRun: boolean;
}

export interface GenerationResult {
  analysis: SystemAnalysis;
  stateDesign: StateDesign;
  eventDesign: EventDesign;
  files: GeneratedFile[];
  simulationName: string;
  outputDir: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
}

export enum FileType {
  TYPESCRIPT = 'typescript',
  JSON = 'json',
  MARKDOWN = 'markdown',
  PACKAGE_JSON = 'package-json',
  CONFIG = 'config'
}

// Enhancement Types
export interface EnhancementSuggestion {
  title: string;
  description: string;
  codeExample?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'performance' | 'quality' | 'features' | 'testing' | 'documentation';
}

// Agent Request/Response Types
export interface AnalysisRequest {
  description: string;
  template: SimulationTemplate;
}

export interface StateDesignRequest {
  analysis: SystemAnalysis;
  template: SimulationTemplate;
}

export interface EventDesignRequest {
  analysis: SystemAnalysis;
  stateDesign: StateDesign;
  template: SimulationTemplate;
}

export interface CodeGenerationRequest {
  analysis: SystemAnalysis;
  stateDesign: StateDesign;
  eventDesign: EventDesign;
  simulationName: string;
  template: SimulationTemplate;
  config: any;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
}