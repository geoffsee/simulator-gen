import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import {
  StateDesignRequest,
  StateDesign,
  StateDefinition,
  TransitionDefinition,
  StateType,
  ValidationRule,
  StateProperty,
  StateGroupDefinition
} from './types.js';

export class StateModeler {
  private stateModelingAgent: Agent;

  constructor() {
    this.stateModelingAgent = new Agent({
      name: 'StateModeler',
      instructions: `
        You are an expert in state machine design who creates comprehensive state models
        for event-driven simulations. Your task is to analyze system information and 
        design appropriate state machines.

        Given system analysis data, you should:

        1. IDENTIFY STATES: Determine all possible states the system can be in
           - Consider entity states, process stages, and system conditions
           - Classify states by type (initial, intermediate, final, error, waiting, processing)
           - Define state properties and their types
           - Add validation rules where appropriate

        2. DESIGN TRANSITIONS: Define how states connect and change
           - Identify what triggers state changes
           - Define conditions that must be met for transitions
           - Specify actions that occur during transitions
           - Consider probability weights for random transitions

        3. ORGANIZE STRUCTURE: Create a well-organized state machine
           - Choose appropriate initial and final states
           - Group related states when helpful
           - Ensure all states are reachable and valid

        Always return valid JSON in the specified format.
        Focus on creating realistic, practical state machines that reflect real-world behavior.
      `,
      tools: [
        this.createStateIdentificationTool(),
        this.createTransitionDesignTool(),
        this.createValidationTool()
      ]
    });
  }

  async design(request: StateDesignRequest): Promise<StateDesign> {
    try {
      const designPrompt = `
        Design a comprehensive state machine based on this system analysis:

        ENTITIES: ${JSON.stringify(request.analysis.entities, null, 2)}
        PROCESSES: ${JSON.stringify(request.analysis.processes, null, 2)}
        RELATIONSHIPS: ${JSON.stringify(request.analysis.relationships, null, 2)}
        CONSTRAINTS: ${JSON.stringify(request.analysis.constraints, null, 2)}
        SYSTEM TYPE: ${request.analysis.systemType}
        COMPLEXITY: ${request.analysis.complexity}

        TEMPLATE CONTEXT:
        Template: ${request.template.name}
        Default States: ${request.template.defaultStates.join(', ')}
        Common Events: ${request.template.commonEvents.join(', ')}

        Design a state machine that captures the behavior of this system.
        Return a JSON object with this structure:

        {
          "states": [
            {
              "name": "string",
              "description": "string",
              "type": "initial|intermediate|final|error|waiting|processing",
              "properties": [
                {
                  "name": "string",
                  "type": "string",
                  "defaultValue": "any",
                  "description": "string"
                }
              ],
              "validationRules": [
                {
                  "property": "string",
                  "rule": "string", 
                  "errorMessage": "string"
                }
              ],
              "entryActions": ["string"],
              "exitActions": ["string"]
            }
          ],
          "transitions": [
            {
              "from": "string",
              "to": "string", 
              "trigger": "string",
              "conditions": ["string"],
              "actions": ["string"],
              "probability": 0.5
            }
          ],
          "initialState": "string",
          "finalStates": ["string"],
          "stateGroups": [
            {
              "name": "string",
              "states": ["string"],
              "description": "string"
            }
          ]
        }

        Ensure the state machine is:
        - Complete (all necessary states included)
        - Connected (all states reachable)
        - Practical (reflects real-world behavior)
        - Extensible (can be enhanced later)
      `;

      const result = await run(this.stateModelingAgent, designPrompt);

      try {
        const stateDesign = JSON.parse(result.finalOutput) as StateDesign;
        return this.validateAndEnhanceStateDesign(stateDesign, request);
      } catch (parseError) {
        console.warn('Failed to parse state design JSON, using fallback design');
        return this.createFallbackStateDesign(request);
      }

    } catch (error) {
      console.error('State modeling failed:', error);
      return this.createFallbackStateDesign(request);
    }
  }

  private validateAndEnhanceStateDesign(design: StateDesign, request: StateDesignRequest): StateDesign {
    // Ensure required fields exist
    design.states = design.states || [];
    design.transitions = design.transitions || [];
    design.finalStates = design.finalStates || [];
    design.stateGroups = design.stateGroups || [];

    // Add default states if none provided
    if (design.states.length === 0) {
      design.states = this.createDefaultStates(request);
    }

    // Ensure initial state is set and valid
    if (!design.initialState || !design.states.find(s => s.name === design.initialState)) {
      const initialState = design.states.find(s => s.type === StateType.INITIAL);
      design.initialState = initialState ? initialState.name : design.states[0]?.name || 'Initial';
    }

    // Add missing state types
    this.ensureStateTypes(design);

    // Validate and add missing transitions
    this.addMissingTransitions(design, request);

    // Add state properties if missing
    this.addStateProperties(design, request);

    // Create state groups for organization
    this.createStateGroups(design);

    return design;
  }

  private createFallbackStateDesign(request: StateDesignRequest): StateDesign {
    const templateStates = request.template.defaultStates;
    
    // Create states based on template and analysis
    const states: StateDefinition[] = templateStates.map((stateName, index) => ({
      name: stateName,
      description: `${stateName} state in the system`,
      type: this.inferStateType(stateName, index, templateStates.length),
      properties: this.getDefaultStateProperties(stateName),
      validationRules: [],
      entryActions: [`log('Entered ${stateName} state')`],
      exitActions: [`log('Exiting ${stateName} state')`]
    }));

    // Add error state if not present
    if (!states.find(s => s.type === StateType.ERROR)) {
      states.push({
        name: 'Error',
        description: 'Error state for handling failures',
        type: StateType.ERROR,
        properties: [
          { name: 'errorMessage', type: 'string', description: 'Error description' },
          { name: 'errorCode', type: 'string', description: 'Error code' }
        ],
        validationRules: [],
        entryActions: [`logError('System error occurred')`],
        exitActions: []
      });
    }

    // Create basic transitions
    const transitions: TransitionDefinition[] = [];
    for (let i = 0; i < states.length - 1; i++) {
      transitions.push({
        from: states[i].name,
        to: states[i + 1].name,
        trigger: `proceed_from_${states[i].name.toLowerCase()}`,
        conditions: [],
        actions: [`updateProgress('${states[i + 1].name}')`],
        probability: 0.8
      });
    }

    // Add error transitions
    states.forEach(state => {
      if (state.type !== StateType.ERROR) {
        transitions.push({
          from: state.name,
          to: 'Error',
          trigger: 'error_occurred',
          conditions: ['hasError()'],
          actions: ['handleError()'],
          probability: 0.1
        });
      }
    });

    const finalStates = states.filter(s => s.type === StateType.FINAL).map(s => s.name);

    return {
      states,
      transitions,
      initialState: states[0].name,
      finalStates: finalStates.length > 0 ? finalStates : [states[states.length - 1].name],
      stateGroups: this.createDefaultStateGroups(states)
    };
  }

  private inferStateType(stateName: string, index: number, totalStates: number): StateType {
    const lowerName = stateName.toLowerCase();
    
    if (index === 0 || lowerName.includes('initial') || lowerName.includes('start')) {
      return StateType.INITIAL;
    }
    
    if (index === totalStates - 1 || lowerName.includes('complete') || lowerName.includes('done') || lowerName.includes('finish')) {
      return StateType.FINAL;
    }
    
    if (lowerName.includes('error') || lowerName.includes('fail')) {
      return StateType.ERROR;
    }
    
    if (lowerName.includes('wait') || lowerName.includes('pending') || lowerName.includes('queue')) {
      return StateType.WAITING;
    }
    
    if (lowerName.includes('process') || lowerName.includes('work') || lowerName.includes('active')) {
      return StateType.PROCESSING;
    }
    
    return StateType.INTERMEDIATE;
  }

  private getDefaultStateProperties(stateName: string): StateProperty[] {
    const baseProperties: StateProperty[] = [
      { name: 'enteredAt', type: 'Date', defaultValue: 'new Date()', description: 'When this state was entered' },
      { name: 'attempts', type: 'number', defaultValue: 0, description: 'Number of attempts in this state' }
    ];

    const lowerName = stateName.toLowerCase();
    
    if (lowerName.includes('process') || lowerName.includes('work')) {
      baseProperties.push(
        { name: 'progress', type: 'number', defaultValue: 0, description: 'Processing progress (0-100)' },
        { name: 'currentTask', type: 'string', description: 'Current task being processed' }
      );
    }
    
    if (lowerName.includes('wait') || lowerName.includes('pending')) {
      baseProperties.push(
        { name: 'waitReason', type: 'string', description: 'Reason for waiting' },
        { name: 'expectedWaitTime', type: 'number', description: 'Expected wait time in milliseconds' }
      );
    }
    
    if (lowerName.includes('error') || lowerName.includes('fail')) {
      baseProperties.push(
        { name: 'errorType', type: 'string', description: 'Type of error that occurred' },
        { name: 'errorDetails', type: 'object', description: 'Detailed error information' },
        { name: 'recoverable', type: 'boolean', defaultValue: true, description: 'Whether the error is recoverable' }
      );
    }
    
    return baseProperties;
  }

  private ensureStateTypes(design: StateDesign): void {
    // Ensure we have at least one initial state
    if (!design.states.find(s => s.type === StateType.INITIAL)) {
      const firstState = design.states[0];
      if (firstState) {
        firstState.type = StateType.INITIAL;
      }
    }

    // Ensure we have at least one final state
    if (!design.states.find(s => s.type === StateType.FINAL)) {
      const lastState = design.states[design.states.length - 1];
      if (lastState && lastState.type === StateType.INTERMEDIATE) {
        lastState.type = StateType.FINAL;
      }
    }
  }

  private addMissingTransitions(design: StateDesign, request: StateDesignRequest): void {
    const stateNames = design.states.map(s => s.name);
    
    // Ensure all states have at least one outgoing transition (except final states)
    design.states.forEach(state => {
      if (state.type !== StateType.FINAL) {
        const hasOutgoing = design.transitions.some(t => t.from === state.name);
        if (!hasOutgoing) {
          // Add a default transition to next state or back to initial
          const nextState = this.findNextLogicalState(state, design.states);
          if (nextState) {
            design.transitions.push({
              from: state.name,
              to: nextState.name,
              trigger: `advance_from_${state.name.toLowerCase()}`,
              conditions: [],
              actions: [`transition('${nextState.name}')`]
            });
          }
        }
      }
    });
  }

  private findNextLogicalState(currentState: StateDefinition, allStates: StateDefinition[]): StateDefinition | null {
    const currentIndex = allStates.indexOf(currentState);
    
    // Try next state in sequence
    if (currentIndex < allStates.length - 1) {
      return allStates[currentIndex + 1];
    }
    
    // Try to find a final state
    const finalState = allStates.find(s => s.type === StateType.FINAL);
    if (finalState && finalState !== currentState) {
      return finalState;
    }
    
    return null;
  }

  private addStateProperties(design: StateDesign, request: StateDesignRequest): void {
    design.states.forEach(state => {
      if (!state.properties || state.properties.length === 0) {
        state.properties = this.getDefaultStateProperties(state.name);
      }
    });
  }

  private createStateGroups(design: StateDesign): void {
    const groups = new Map<string, string[]>();
    
    design.states.forEach(state => {
      const groupName = this.getStateGroupName(state);
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(state.name);
    });

    design.stateGroups = Array.from(groups.entries())
      .filter(([_, states]) => states.length > 1)
      .map(([name, states]) => ({
        name,
        states,
        description: `Group of ${name.toLowerCase()} states`
      }));
  }

  private createDefaultStateGroups(states: StateDefinition[]): StateGroupDefinition[] {
    const typeGroups = new Map<StateType, string[]>();
    
    states.forEach(state => {
      if (!typeGroups.has(state.type)) {
        typeGroups.set(state.type, []);
      }
      typeGroups.get(state.type)!.push(state.name);
    });

    return Array.from(typeGroups.entries())
      .filter(([_, stateNames]) => stateNames.length > 1)
      .map(([type, stateNames]) => ({
        name: `${type}States`,
        states: stateNames,
        description: `All ${type} states in the system`
      }));
  }

  private getStateGroupName(state: StateDefinition): string {
    switch (state.type) {
      case StateType.INITIAL: return 'Initial';
      case StateType.FINAL: return 'Final';
      case StateType.ERROR: return 'Error';
      case StateType.WAITING: return 'Waiting';
      case StateType.PROCESSING: return 'Processing';
      default: return 'General';
    }
  }

  private createStateIdentificationTool() {
    return tool({
      name: 'identifyStates',
      description: 'Identify possible states from system analysis',
      parameters: z.object({
        states: z.array(z.object({
          name: z.string(),
          description: z.string(),
          type: z.string()
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          statesIdentified: input.states.length,
          states: input.states
        });
      }
    });
  }

  private createTransitionDesignTool() {
    return tool({
      name: 'designTransitions',
      description: 'Design state transitions',
      parameters: z.object({
        transitions: z.array(z.object({
          from: z.string(),
          to: z.string(),
          trigger: z.string()
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          transitionsDesigned: input.transitions.length,
          transitions: input.transitions
        });
      }
    });
  }

  private createValidationTool() {
    return tool({
      name: 'validateStateDesign',
      description: 'Validate state machine design',
      parameters: z.object({
        isValid: z.boolean(),
        issues: z.array(z.string())
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'validation_complete',
          isValid: input.isValid,
          issues: input.issues
        });
      }
    });
  }
}