import { Agent, run } from '@openai/agents';
import { SimulationTemplate } from '../templates/types.js';
import { SimulationAnalysis, GenerationRequest, GenerationResult, EnhancementSuggestion } from './types.js';
import { SystemAnalyzer } from './system-analyzer.js';
import { StateModeler } from './state-modeler.js';
import { EventDesigner } from './event-designer.js';
import { CodeGenerator } from './code-generator.js';

export class AgentOrchestrator {
  private systemAnalyzer: SystemAnalyzer;
  private stateModeler: StateModeler;
  private eventDesigner: EventDesigner;
  private codeGenerator: CodeGenerator;

  constructor() {
    this.systemAnalyzer = new SystemAnalyzer();
    this.stateModeler = new StateModeler();
    this.eventDesigner = new EventDesigner();
    this.codeGenerator = new CodeGenerator();
  }

  async generateSimulation(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🔍 Phase 1: Analyzing system description...');
    
    // Phase 1: System Analysis
    const analysis = await this.systemAnalyzer.analyze({
      description: request.description,
      template: request.template
    });

    console.log('🏗️  Phase 2: Designing state machine...');
    
    // Phase 2: State Machine Design
    const stateDesign = await this.stateModeler.design({
      analysis,
      template: request.template
    });

    console.log('⚡ Phase 3: Designing events...');
    
    // Phase 3: Event System Design
    const eventDesign = await this.eventDesigner.design({
      analysis,
      stateDesign,
      template: request.template
    });

    console.log('💾 Phase 4: Generating code...');
    
    // Phase 4: Code Generation
    const generatedCode = await this.codeGenerator.generate({
      analysis,
      stateDesign,
      eventDesign,
      simulationName: request.simulationName,
      template: request.template,
      config: request.config
    });

    return {
      analysis,
      stateDesign,
      eventDesign,
      files: generatedCode.files,
      simulationName: request.simulationName,
      outputDir: request.outputDir
    };
  }

  async generateClarifyingQuestions(description: string): Promise<string[]> {
    const questionGeneratorAgent = new Agent({
      name: 'QuestionGenerator',
      instructions: `
        You are an expert system analyst who helps clarify system requirements.
        
        Given a system description, generate 3-5 clarifying questions that would help
        create a better simulation. Focus on:
        
        1. Key actors/entities and their roles
        2. Important states and state transitions
        3. Critical events and their triggers
        4. Business rules and constraints
        5. Success criteria and edge cases
        
        Return only the questions as a JSON array of strings.
        Each question should be specific and actionable.
      `
    });

    try {
      const result = await run(questionGeneratorAgent, `
        System description: "${description}"
        
        Generate clarifying questions to help create a better simulation.
      `);

      // Parse the response to extract questions
      const content = result.finalOutput;
      try {
        // Try to parse as JSON first
        return JSON.parse(content);
      } catch {
        // Fallback: extract questions from text
        const lines = content.split('\n');
        const questions = lines
          .filter(line => line.trim().startsWith('-') || line.includes('?'))
          .map(line => line.replace(/^[\s-*•]+/, '').trim())
          .filter(line => line.includes('?'));
        
        return questions.slice(0, 5); // Limit to 5 questions
      }
    } catch (error) {
      console.warn('Failed to generate clarifying questions:', error);
      return [
        'What are the main entities or actors in this system?',
        'What are the key states these entities can be in?',
        'What events trigger state changes?',
        'Are there any important business rules or constraints?',
        'What would constitute success or failure in this system?'
      ];
    }
  }

  async analyzeAndEnhance(directory: string): Promise<EnhancementSuggestion[]> {
    const enhancementAgent = new Agent({
      name: 'SimulationEnhancer',
      instructions: `
        You are an expert simulation architect who analyzes existing simulations
        and suggests improvements.
        
        Based on the provided simulation code, suggest enhancements in these areas:
        1. Code quality and best practices
        2. Simulation realism and accuracy
        3. Performance optimizations
        4. Additional features or capabilities
        5. Testing and monitoring improvements
        
        Provide practical, actionable suggestions with brief code examples where helpful.
        Return suggestions as JSON array with title, description, and optional codeExample fields.
      `
    });

    try {
      // Read key files from the simulation directory
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const keyFiles = [
        'src/index.ts',
        'src/types.ts', 
        'src/state-machine.ts',
        'src/events.ts',
        'package.json'
      ];

      let codeContent = '';
      for (const file of keyFiles) {
        try {
          const filePath = path.join(directory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          codeContent += `\n\n=== ${file} ===\n${content}`;
        } catch {
          // File might not exist, continue
        }
      }

      const result = await run(enhancementAgent, `
        Analyze this simulation code and suggest improvements:
        ${codeContent}
        
        Provide suggestions as JSON array with format:
        [{"title": "...", "description": "...", "codeExample": "..."}]
      `);

      try {
        return JSON.parse(result.finalOutput);
      } catch {
        // Fallback suggestions
        return [
          {
            title: 'Add Performance Monitoring',
            description: 'Track simulation performance metrics like events per second and memory usage',
            codeExample: 'engine.on("eventProcessed", (event) => metrics.recordEvent(event));'
          },
          {
            title: 'Improve Error Handling',
            description: 'Add comprehensive error handling for invalid state transitions and malformed events',
            codeExample: 'try { this.transition(newState); } catch (error) { this.handleTransitionError(error); }'
          },
          {
            title: 'Add Unit Tests',
            description: 'Create comprehensive test coverage for state machine logic and event handlers',
            codeExample: 'test("should transition from initial to processing", () => { ... });'
          }
        ];
      }
    } catch (error) {
      console.warn('Failed to analyze simulation for enhancements:', error);
      return [{
        title: 'Analysis Failed',
        description: 'Could not analyze simulation. Ensure the directory contains a valid simulation package.',
        codeExample: undefined
      }];
    }
  }

  private async validateGeneratedCode(files: Array<{ path: string; content: string }>): Promise<boolean> {
    // TODO: Implement TypeScript validation
    // This would compile the generated TypeScript code to ensure it's valid
    return true;
  }

  private async runQualityChecks(generationResult: GenerationResult): Promise<void> {
    const qualityAgent = new Agent({
      name: 'QualityReviewer',
      instructions: `
        You are a code quality expert who reviews generated simulation code.
        
        Check for:
        1. TypeScript best practices
        2. Proper error handling
        3. Clear naming conventions
        4. Adequate documentation
        5. Framework usage patterns
        
        Provide brief feedback on any issues found.
      `
    });

    try {
      const codeContent = generationResult.files
        .map(f => `=== ${f.path} ===\n${f.content}`)
        .join('\n\n');

      const result = await run(qualityAgent, `
        Review this generated simulation code for quality issues:
        ${codeContent}
      `);

      console.log('🔍 Quality Review:', result.finalOutput);
    } catch (error) {
      console.warn('Quality check failed:', error);
    }
  }
}