export interface SimulationTemplate {
  name: string;
  description: string;
  defaultStates: string[];
  commonEvents: string[];
  templateFiles: {
    [filename: string]: string; // Template content with placeholders
  };
  dependencies: string[];
  agentInstructions?: string; // Specialized instructions for this domain
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'array' | 'object' | 'boolean';
  description: string;
  defaultValue?: any;
  required?: boolean;
}