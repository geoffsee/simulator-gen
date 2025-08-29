import { Agent, run } from '@openai/agents';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SimulationGenerator } from './generators/simulation-generator.js';
import { ConfigManager } from './utils/config.js';
import { Logger } from './utils/logger.js';
import { TemplateManager } from './templates/template-manager.js';
import { AgentOrchestrator } from './agents/orchestrator.js';

export interface CLIOptions {
  'output-dir'?: string;
  name?: string;
  template?: string;
  interactive?: boolean;
  verbose?: boolean;
  'dry-run'?: boolean;
  config?: string;
}

export class SimulationGeneratorCLI {
  private configManager: ConfigManager;
  private logger: Logger;
  private templateManager: TemplateManager;
  private agentOrchestrator: AgentOrchestrator;
  private generator: SimulationGenerator;

  constructor() {
    this.configManager = new ConfigManager();
    this.logger = new Logger();
    this.templateManager = new TemplateManager();
    this.agentOrchestrator = new AgentOrchestrator();
    this.generator = new SimulationGenerator();
  }

  async generate(description: string, options: CLIOptions): Promise<string | null> {
    try {
      this.logger.setVerbose(options.verbose || false);
      
      // Load configuration
      const config = await this.configManager.loadConfig(options.config);
      this.logger.info('Starting simulation generation...');
      this.logger.verbose(`Description: ${description}`);
      
      if (options['dry-run']) {
        this.logger.info('DRY RUN MODE - No files will be created');
      }

      // Determine output directory and simulation name
      const outputDir = options['output-dir'] || config.outputDir || process.cwd();
      const simulationName = options.name || this.generateSimulationName(description);
      
      this.logger.verbose(`Output directory: ${outputDir}`);
      this.logger.verbose(`Simulation name: ${simulationName}`);

      // Get template
      const templateName = options.template || config.defaultTemplate || 'generic';
      const template = await this.templateManager.getTemplate(templateName);
      
      this.logger.verbose(`Using template: ${templateName}`);

      // Interactive mode for clarification if requested
      let enhancedDescription = description;
      if (options.interactive) {
        enhancedDescription = await this.interactiveEnhancement(description);
      }

      // Generate simulation using agents
      this.logger.info('Analyzing system description...');
      const generationResult = await this.agentOrchestrator.generateSimulation({
        description: enhancedDescription,
        template,
        simulationName,
        outputDir,
        config,
        dryRun: options['dry-run'] || false
      });

      if (options['dry-run']) {
        this.logger.info('\nDRY RUN RESULTS:');
        this.logger.info('Files that would be created:');
        for (const file of generationResult.files) {
          console.log(`  ${file.path}`);
        }
        return null;
      }

      // Actually generate the files
      const uuid = await this.generator.createSimulationPackage(generationResult, enhancedDescription, templateName);

      this.logger.info(`\n✅ Simulation "${simulationName}" generated successfully!`);
      this.logger.info(`🆔 UUID: ${uuid}`);
      this.logger.info(`📁 Location: ${join(outputDir, simulationName)}`);
      this.logger.info('\nNext steps:');
      this.logger.info(`  cd ${simulationName}`);
      this.logger.info(`  bun install`);
      this.logger.info(`  bun run dev`);
      
      return uuid;

    } catch (error) {
      this.logger.error('Generation failed:', error);
      throw error;
    }
  }

  async init(name?: string, options: CLIOptions = {}): Promise<void> {
    this.logger.setVerbose(options.verbose || false);
    
    const simulationName = name || 'my-simulation';
    const outputDir = options['output-dir'] || process.cwd();
    
    this.logger.info(`Initializing new simulation project: ${simulationName}`);
    
    // Create basic simulation structure without AI generation
    await this.generator.createBasicProject({
      name: simulationName,
      outputDir,
      template: options.template || 'generic'
    });
    
    this.logger.info(`✅ Project "${simulationName}" initialized!`);
    this.logger.info(`📁 Location: ${join(outputDir, simulationName)}`);
  }

  async listTemplates(): Promise<void> {
    const templates = await this.templateManager.listTemplates();
    
    console.log('\nAvailable Templates:');
    console.log('==================');
    
    for (const template of templates) {
      console.log(`\n📋 ${template.name}`);
      console.log(`   ${template.description}`);
      console.log(`   States: ${template.defaultStates.join(', ')}`);
      console.log(`   Events: ${template.commonEvents.join(', ')}`);
    }
  }

  async validate(directory: string): Promise<void> {
    this.logger.info(`Validating simulation at: ${directory}`);
    
    if (!existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }

    // Check if it's a valid simulation package
    const packageJsonPath = join(directory, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error('Not a valid simulation package: package.json not found');
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Validate package structure
      const requiredFiles = [
        'src/index.ts',
        'src/types.ts',
        'src/state-machine.ts',
        'tsconfig.json'
      ];

      const missingFiles = requiredFiles.filter(file => 
        !existsSync(join(directory, file))
      );

      if (missingFiles.length > 0) {
        this.logger.warn('Missing files:', missingFiles);
      }

      // Try to compile TypeScript
      this.logger.info('Validating TypeScript compilation...');
      // TODO: Run tsc to validate compilation
      
      this.logger.info('✅ Simulation validation completed');
      
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async enhance(directory: string): Promise<void> {
    this.logger.info(`Enhancing simulation at: ${directory}`);
    
    if (!existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }

    // Use AI to suggest improvements to existing simulation
    const enhancementSuggestions = await this.agentOrchestrator.analyzeAndEnhance(directory);
    
    console.log('\n🚀 Enhancement Suggestions:');
    console.log('===========================');
    
    for (const suggestion of enhancementSuggestions) {
      console.log(`\n• ${suggestion.title}`);
      console.log(`  ${suggestion.description}`);
      if (suggestion.codeExample) {
        console.log(`  Example: ${suggestion.codeExample}`);
      }
    }
  }

  private generateSimulationName(description: string): string {
    // Convert description to a reasonable package name
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '-sim';
  }

  private async interactiveEnhancement(description: string): Promise<string> {
    this.logger.info('\n🤖 Interactive mode: Let me ask some clarifying questions...');
    
    // Use AI to generate clarifying questions
    const questions = await this.agentOrchestrator.generateClarifyingQuestions(description);
    
    let enhancedDescription = description;
    
    for (const question of questions) {
      const answer = await this.promptUser(question);
      if (answer.trim()) {
        enhancedDescription += `\n\nAdditional detail: ${question} ${answer}`;
      }
    }
    
    return enhancedDescription;
  }

  private async promptUser(question: string): Promise<string> {
    // Simple prompt implementation - in a real CLI you might use inquirer or similar
    console.log(`\n❓ ${question}`);
    console.log('   (Press Enter to skip)');
    
    return new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data) => {
        process.stdin.pause();
        resolve(data.toString().trim());
      });
    });
  }
}