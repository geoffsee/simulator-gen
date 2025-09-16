import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { 
  AnalysisRequest, 
  SystemAnalysis, 
  EntityDefinition, 
  ProcessDefinition,
  RelationshipDefinition,
  ConstraintDefinition,
  SystemType,
  ComplexityLevel,
  EntityRole,
  RelationshipType,
  ConstraintType
} from './types.js';

export class SystemAnalyzer {
  private analysisAgent: Agent;

  constructor() {
    this.analysisAgent = new Agent({
      name: 'SystemAnalyzer',
      instructions: `
        You are an expert system analyst who analyzes textual descriptions of systems 
        and extracts structured information about entities, processes, relationships, 
        and constraints.

        Your task is to parse system descriptions and return a structured analysis in JSON format.
        
        For each system description, identify:
        
        1. ENTITIES: The main actors, objects, or components in the system
           - Name and description
           - Key attributes and their types
           - Role (primary, secondary, external, system)
        
        2. PROCESSES: The workflows or procedures in the system
           - Name and description
           - What triggers the process
           - Steps involved
           - Possible outcomes
        
        3. RELATIONSHIPS: How entities relate to each other
           - From/to entities
           - Type of relationship (one-to-one, one-to-many, etc.)
           - Description of the relationship
        
        4. CONSTRAINTS: Business rules, technical limitations, or requirements
           - Type (business-rule, technical, temporal, security, compliance)
           - Description
           - Enforcement level (strict, warning, informational)
        
        5. CLASSIFICATION: Determine the system type and complexity
           - System type (business-process, workflow, game, iot-system, etc.)
           - Complexity level (simple, moderate, complex, very-complex)
           - Recommended template
        
        Always return valid JSON in the specified format. Be thorough but concise.
      `,
      tools: [
        this.createEntityExtractionTool(),
        this.createProcessExtractionTool(),
        this.createRelationshipExtractionTool(),
        this.createConstraintExtractionTool(),
        this.createClassificationTool()
      ]
    });
  }

  async analyze(request: AnalysisRequest): Promise<SystemAnalysis> {
    try {
      const analysisPrompt = `
        Analyze this system description and provide a comprehensive structural analysis:
        
        System Description: "${request.description}"
        
        Template Context: The user has selected the "${request.template.name}" template.
        Template Description: ${request.template.description}
        Default States: ${request.template.defaultStates.join(', ')}
        Common Events: ${request.template.commonEvents.join(', ')}
        
        Please provide a complete analysis in the following JSON format:
        {
          "entities": [
            {
              "name": "string",
              "description": "string", 
              "attributes": [{"name": "string", "type": "string", "optional": boolean, "description": "string"}],
              "role": "primary|secondary|external|system"
            }
          ],
          "processes": [
            {
              "name": "string",
              "description": "string",
              "trigger": "string",
              "steps": [{"name": "string", "description": "string", "duration": "string", "conditions": ["string"]}],
              "outcomes": ["string"]
            }
          ],
          "relationships": [
            {
              "from": "string",
              "to": "string", 
              "type": "one-to-one|one-to-many|many-to-many|dependency|composition",
              "description": "string"
            }
          ],
          "constraints": [
            {
              "type": "business-rule|technical|temporal|security|compliance",
              "description": "string",
              "enforcementLevel": "strict|warning|informational"
            }
          ],
          "systemType": "business-process|workflow|game|iot-system|network|financial|healthcare|logistics|generic",
          "complexity": "simple|moderate|complex|very-complex",
          "recommendedTemplate": "string"
        }
      `;

      const result = await run(this.analysisAgent, analysisPrompt);
      
      try {
        const analysis = JSON.parse(result.finalOutput) as SystemAnalysis;
        
        // Validate and enhance the analysis
        return this.validateAndEnhanceAnalysis(analysis, request);
        
      } catch (parseError) {
        console.warn('Failed to parse analysis JSON, using fallback analysis');
        return this.createFallbackAnalysis(request);
      }
      
    } catch (error) {
      console.error('System analysis failed:', error);
      return this.createFallbackAnalysis(request);
    }
  }

  private validateAndEnhanceAnalysis(analysis: SystemAnalysis, request: AnalysisRequest): SystemAnalysis {
    // Ensure all required fields are present
    analysis.entities = analysis.entities || [];
    analysis.processes = analysis.processes || [];
    analysis.relationships = analysis.relationships || [];
    analysis.constraints = analysis.constraints || [];
    
    // Set defaults if missing
    if (!analysis.systemType) {
      analysis.systemType = this.inferSystemType(request.description);
    }
    
    if (!analysis.complexity) {
      analysis.complexity = this.inferComplexity(analysis);
    }
    
    if (!analysis.recommendedTemplate) {
      analysis.recommendedTemplate = this.selectRecommendedTemplate(analysis.systemType, request.template.name);
    }
    
    // Add derived entities if missing key ones
    if (analysis.entities.length === 0) {
      analysis.entities.push(this.createDefaultEntity(request.description));
    }
    
    return analysis;
  }

  private createFallbackAnalysis(request: AnalysisRequest): SystemAnalysis {
    const description = request.description;
    const words = description.toLowerCase().split(' ');
    
    // Create basic entities from common nouns
    const entities: EntityDefinition[] = [
      {
        name: 'System',
        description: 'Main system entity',
        attributes: [
          { name: 'id', type: 'string', optional: false, description: 'Unique identifier' },
          { name: 'status', type: 'string', optional: false, description: 'Current status' },
          { name: 'createdAt', type: 'date', optional: false, description: 'Creation timestamp' }
        ],
        role: EntityRole.PRIMARY
      }
    ];

    // Create basic process
    const processes: ProcessDefinition[] = [
      {
        name: 'Main Process',
        description: 'Primary system process',
        trigger: 'System initialization or external event',
        steps: [
          { name: 'Initialize', description: 'Set up initial state' },
          { name: 'Process', description: 'Execute main logic' },
          { name: 'Complete', description: 'Finalize and cleanup' }
        ],
        outcomes: ['Success', 'Failure', 'Pending']
      }
    ];

    const systemType = this.inferSystemType(description);
    
    return {
      entities,
      processes,
      relationships: [],
      constraints: [
        {
          type: ConstraintType.BUSINESS_RULE,
          description: 'System must maintain data consistency',
          enforcementLevel: 'strict'
        }
      ],
      systemType,
      complexity: ComplexityLevel.MODERATE,
      recommendedTemplate: request.template.name
    };
  }

  private inferSystemType(description: string): SystemType {
    const lower = description.toLowerCase();

    // Treat political campaign finance as a financial system
    if (
      lower.includes('campaign') ||
      lower.includes('election') ||
      lower.includes('donation') ||
      lower.includes('contribution') ||
      lower.includes('funding') ||
      lower.includes('fundraise') ||
      lower.includes('fec') ||
      lower.includes('pac') ||
      lower.includes('super pac')
    ) {
      return SystemType.FINANCIAL;
    }
    
    if (lower.includes('game') || lower.includes('player') || lower.includes('score')) {
      return SystemType.GAME;
    }
    if (lower.includes('iot') || lower.includes('sensor') || lower.includes('device')) {
      return SystemType.IOT_SYSTEM;
    }
    if (lower.includes('workflow') || lower.includes('approval') || lower.includes('task')) {
      return SystemType.WORKFLOW;
    }
    if (lower.includes('business') || lower.includes('process') || lower.includes('customer')) {
      return SystemType.BUSINESS_PROCESS;
    }
    if (lower.includes('financial') || lower.includes('payment') || lower.includes('transaction')) {
      return SystemType.FINANCIAL;
    }
    if (lower.includes('health') || lower.includes('medical') || lower.includes('patient')) {
      return SystemType.HEALTHCARE;
    }
    if (lower.includes('logistics') || lower.includes('shipping') || lower.includes('delivery')) {
      return SystemType.LOGISTICS;
    }
    if (lower.includes('network') || lower.includes('server') || lower.includes('connection')) {
      return SystemType.NETWORK;
    }
    
    return SystemType.GENERIC;
  }

  private inferComplexity(analysis: SystemAnalysis): ComplexityLevel {
    let score = 0;
    
    // Score based on number of entities
    score += Math.min(analysis.entities.length * 2, 10);
    
    // Score based on number of processes
    score += Math.min(analysis.processes.length * 3, 15);
    
    // Score based on number of relationships
    score += Math.min(analysis.relationships.length * 2, 10);
    
    // Score based on number of constraints
    score += Math.min(analysis.constraints.length * 1, 5);
    
    if (score < 10) return ComplexityLevel.SIMPLE;
    if (score < 20) return ComplexityLevel.MODERATE;
    if (score < 30) return ComplexityLevel.COMPLEX;
    return ComplexityLevel.VERY_COMPLEX;
  }

  private selectRecommendedTemplate(systemType: SystemType, currentTemplate: string): string {
    const templateMap: Record<SystemType, string> = {
      [SystemType.BUSINESS_PROCESS]: 'business',
      [SystemType.WORKFLOW]: 'business',
      [SystemType.GAME]: 'game',
      [SystemType.IOT_SYSTEM]: 'iot',
      [SystemType.NETWORK]: 'iot',
      [SystemType.FINANCIAL]: 'business',
      [SystemType.HEALTHCARE]: 'business',
      [SystemType.LOGISTICS]: 'business',
      [SystemType.GENERIC]: 'generic'
    };
    
    return templateMap[systemType] || currentTemplate;
  }

  private createDefaultEntity(description: string): EntityDefinition {
    // Extract potential entity name from description
    const words = description.split(' ');
    const entityName = words.find(word => 
      word.length > 3 && 
      /^[A-Z]/.test(word) && 
      !['The', 'This', 'That', 'When', 'Where', 'What', 'How'].includes(word)
    ) || 'Entity';

    return {
      name: entityName,
      description: `Main entity in the ${description} system`,
      attributes: [
        { name: 'id', type: 'string', optional: false },
        { name: 'status', type: 'string', optional: false },
        { name: 'updatedAt', type: 'date', optional: false }
      ],
      role: EntityRole.PRIMARY
    };
  }

  private createEntityExtractionTool() {
    return tool({
      name: 'extractEntities',
      description: 'Extract entities from system description',
      parameters: z.object({
        entities: z.array(z.object({
          name: z.string(),
          description: z.string(),
          role: z.enum(['primary', 'secondary', 'external', 'system'])
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          entitiesFound: input.entities.length,
          entities: input.entities
        });
      }
    });
  }

  private createProcessExtractionTool() {
    return tool({
      name: 'extractProcesses',
      description: 'Extract processes from system description',
      parameters: z.object({
        processes: z.array(z.object({
          name: z.string(),
          description: z.string(),
          trigger: z.string()
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          processesFound: input.processes.length,
          processes: input.processes
        });
      }
    });
  }

  private createRelationshipExtractionTool() {
    return tool({
      name: 'extractRelationships',
      description: 'Extract relationships between entities',
      parameters: z.object({
        relationships: z.array(z.object({
          from: z.string(),
          to: z.string(),
          type: z.string()
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          relationshipsFound: input.relationships.length,
          relationships: input.relationships
        });
      }
    });
  }

  private createConstraintExtractionTool() {
    return tool({
      name: 'extractConstraints',
      description: 'Extract constraints and business rules',
      parameters: z.object({
        constraints: z.array(z.object({
          type: z.string(),
          description: z.string(),
          enforcementLevel: z.string()
        }))
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          constraintsFound: input.constraints.length,
          constraints: input.constraints
        });
      }
    });
  }

  private createClassificationTool() {
    return tool({
      name: 'classifySystem',
      description: 'Classify system type and complexity',
      parameters: z.object({
        systemType: z.string(),
        complexity: z.string(),
        recommendedTemplate: z.string()
      }),
      execute: async (input) => {
        return JSON.stringify({
          status: 'success',
          classification: {
            systemType: input.systemType,
            complexity: input.complexity,
            recommendedTemplate: input.recommendedTemplate
          }
        });
      }
    });
  }
}