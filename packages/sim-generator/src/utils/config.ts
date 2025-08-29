import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Config {
  defaultTemplate: string;
  outputDir: string;
  openaiApiKey?: string;
  agentConfig: {
    model: string;
    temperature: number;
  };
  codeStyle: {
    useSemicolons: boolean;
    quotes: 'single' | 'double';
    indentSize: number;
  };
  features: {
    includeTests: boolean;
    includeDocumentation: boolean;
    includeExamples: boolean;
  };
}

export class ConfigManager {
  private defaultConfig: Config = {
    defaultTemplate: 'generic',
    outputDir: './simulations',
    agentConfig: {
      model: 'gpt-4',
      temperature: 0.3
    },
    codeStyle: {
      useSemicolons: true,
      quotes: 'single',
      indentSize: 2
    },
    features: {
      includeTests: true,
      includeDocumentation: true,
      includeExamples: true
    }
  };

  async loadConfig(configPath?: string): Promise<Config> {
    let config = { ...this.defaultConfig };

    // Try to load from specified path or default locations
    const paths = configPath 
      ? [configPath]
      : [
          '.simgenrc.json',
          '.simgenrc',
          join(process.env.HOME || '~', '.simgenrc.json'),
          join(process.env.HOME || '~', '.simgenrc')
        ];

    for (const path of paths) {
      if (existsSync(path)) {
        try {
          const fileContent = readFileSync(path, 'utf-8');
          const fileConfig = JSON.parse(fileContent);
          config = this.mergeConfig(config, fileConfig);
          break;
        } catch (error) {
          console.warn(`Failed to load config from ${path}:`, error);
        }
      }
    }

    // Load API key from environment if not in config
    if (!config.openaiApiKey) {
      config.openaiApiKey = process.env.OPENAI_API_KEY;
    }

    return config;
  }

  private mergeConfig(base: Config, override: Partial<Config>): Config {
    return {
      ...base,
      ...override,
      agentConfig: {
        ...base.agentConfig,
        ...(override.agentConfig || {})
      },
      codeStyle: {
        ...base.codeStyle,
        ...(override.codeStyle || {})
      },
      features: {
        ...base.features,
        ...(override.features || {})
      }
    };
  }

  getDefaultConfig(): Config {
    return { ...this.defaultConfig };
  }

  validateConfig(config: Config): string[] {
    const errors: string[] = [];

    if (!config.openaiApiKey) {
      errors.push('OpenAI API key is required. Set OPENAI_API_KEY environment variable or add to config file.');
    }

    if (!config.outputDir) {
      errors.push('Output directory must be specified');
    }

    if (!['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'].includes(config.agentConfig.model)) {
      errors.push(`Unsupported model: ${config.agentConfig.model}`);
    }

    if (config.agentConfig.temperature < 0 || config.agentConfig.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    return errors;
  }
}