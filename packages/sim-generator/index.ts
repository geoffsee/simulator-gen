#!/usr/bin/env bun

/**
 * Sim-Generator CLI Tool
 * Generates simulation packages using OpenAI agents and the simulation framework
 */

import { parseArgs } from "util";
import { SimulationGeneratorCLI } from "./src/cli.js";

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "output-dir": { type: "string", short: "o" },
      "name": { type: "string", short: "n" },
      "template": { type: "string", short: "t" },
      "interactive": { type: "boolean", short: "i" },
      "verbose": { type: "boolean", short: "v" },
      "dry-run": { type: "boolean" },
      "config": { type: "string", short: "c" },
      "help": { type: "boolean", short: "h" }
    },
    allowPositionals: true
  });

  if (values.help || positionals.length === 0) {
    printHelp();
    return;
  }

  const command = positionals[0];
  const description = positionals[1];

  const cli = new SimulationGeneratorCLI();

  try {
    switch (command) {
      case "generate":
        if (!description) {
          console.error("Error: Description required for generate command");
          printHelp();
          return;
        }
        await cli.generate(description, values);
        break;
      
      case "init":
        await cli.init(description, values);
        break;
      
      case "list-templates":
        await cli.listTemplates();
        break;
      
      case "validate":
        if (!description) {
          console.error("Error: Directory path required for validate command");
          return;
        }
        await cli.validate(description);
        break;
      
      case "enhance":
        if (!description) {
          console.error("Error: Directory path required for enhance command");
          return;
        }
        await cli.enhance(description);
        break;
      
      default:
        // Assume first positional is the description for generate
        await cli.generate(command, { ...values, name: description });
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Sim-Generator CLI - Generate event-based simulations using AI

Usage:
  sim-generate <description> [options]              # Generate simulation from description
  sim-generate generate <description> [options]     # Same as above
  sim-generate init [name]                          # Initialize new simulation project
  sim-generate list-templates                       # List available templates
  sim-generate validate <directory>                 # Validate generated simulation
  sim-generate enhance <directory>                  # Enhance existing simulation

Options:
  -o, --output-dir <dir>     Output directory (default: current directory)
  -n, --name <name>          Simulation package name (default: auto-generated)
  -t, --template <template>  Base template (generic, legal, business, game, iot)
  -i, --interactive          Interactive mode with follow-up questions
  -v, --verbose              Verbose output
  --dry-run                  Show what would be generated without creating files
  -c, --config <file>        Configuration file path
  -h, --help                 Show this help

Examples:
  sim-generate "A restaurant order processing system"
  sim-generate "IoT sensor network monitoring" --template iot --verbose
  sim-generate init my-restaurant-sim
  sim-generate validate ./my-simulation
`);
}

if (import.meta.main) {
  main().catch(console.error);
}