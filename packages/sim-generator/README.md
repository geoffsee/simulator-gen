# Simulation Generator CLI

An AI-powered CLI tool that generates event-based simulations using OpenAI agents and the simulation framework. Transform natural language descriptions into complete, runnable simulation packages.

## Overview

The sim-generator is a sophisticated command-line tool that leverages OpenAI agents to analyze system descriptions and automatically generate TypeScript simulation code using the simulators framework. It can create complete simulation packages with state machines, event generators, and proper project structure.

## Features

- **AI-Powered Generation**: Uses OpenAI agents to understand and model complex systems
- **Multiple Templates**: Supports various domains (generic, legal, business, game, IoT)
- **Interactive Mode**: Follow-up questions to refine simulation requirements
- **Project Scaffolding**: Complete package structure with proper configuration
- **Validation Tools**: Verify generated simulations meet framework standards
- **Enhancement Capabilities**: Improve existing simulations with AI suggestions

## Installation

```bash
bun install
```

## Usage

### Generate a Simulation

```bash
# Generate from description
bun run index.ts "A restaurant order processing system"

# With options
bun run index.ts generate "IoT sensor network monitoring" --template iot --verbose

# Interactive mode
bun run index.ts "Hospital patient flow system" --interactive
```

### Other Commands

```bash
# Initialize new project
bun run index.ts init my-simulation

# List available templates
bun run index.ts list-templates

# Validate existing simulation
bun run index.ts validate ./my-simulation

# Enhance simulation with AI
bun run index.ts enhance ./my-simulation
```

### Command Options

- `-o, --output-dir <dir>`: Output directory (default: current directory)
- `-n, --name <name>`: Simulation package name (auto-generated if not specified)
- `-t, --template <template>`: Base template (generic, legal, business, game, iot)
- `-i, --interactive`: Interactive mode with follow-up questions
- `-v, --verbose`: Verbose output showing generation process
- `--dry-run`: Preview what would be generated without creating files
- `-c, --config <file>`: Path to configuration file

## Architecture

The generator uses multiple specialized OpenAI agents:

- **SimulationGenerator**: Main agent that orchestrates the generation process
- **StateModeler**: Expert at designing state machines and transitions
- **EventDesigner**: Specialist in creating realistic event generators
- **CodeQualityReviewer**: Reviews generated code for best practices

## Output

Generated simulations include:

- Complete TypeScript project structure
- Domain-specific state machine implementation
- Realistic event generators with proper timing
- Configuration files (package.json, tsconfig.json)
- Documentation and usage examples
- Testing utilities

## Dependencies

- OpenAI agents framework
- `@sim-generator/lib`: Core simulation framework
- TypeScript compilation and project management tools

This project was created using `bun init` in bun v1.2.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
