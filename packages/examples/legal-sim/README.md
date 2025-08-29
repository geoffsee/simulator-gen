# Legal Review Simulation

A comprehensive legal review simulation built using the generic simulation framework. This package demonstrates domain-specific implementation of the simulators framework for legal review processes.

## Overview

The legal-sim package provides a realistic simulation of legal review workflows, including evidence handling, deadline management, risk assessment, and decision-making processes. It serves as both a practical tool for understanding legal workflows and as a reference implementation of the simulation framework.

## Features

- **Legal Review State Machine**: Models the complete legal review lifecycle
- **Evidence Management**: Simulates evidence collection, review, and analysis
- **Deadline Tracking**: Realistic deadline management with urgency escalation
- **Risk Assessment**: Dynamic risk scoring based on case developments
- **Event Generation**: Realistic legal events with proper timing and dependencies
- **Real-time Feed**: Live simulation with event processing and status updates

## Usage

### Basic Usage

```bash
# Run the simulation
bun run main.ts
```

### Programmatic Usage

```typescript
import { createLegalReviewMachine, startRealtimeFeed, LEGAL_EVENT_GENERATORS } from '@sim-generator/legal-sim';

// Create a legal review machine
const machine = createLegalReviewMachine({
  file: {
    matterId: "MAT-2025-VA-042",
    clientName: "Blue Ridge Tools, Inc.",
    jurisdiction: "US-EDVA",
    practiceArea: "Commercial"
  }
});

// Start real-time simulation
const stop = startRealtimeFeed(machine, {
  eventGenerators: LEGAL_EVENT_GENERATORS,
  enableLogging: true,
  onEventProcessed: (event) => {
    const summary = machine.summary;
    console.log(`Phase: ${summary.phase}, Risk: ${summary.riskScore}`);
  }
});

// Stop simulation when needed
stop();
```

## Architecture

The legal simulation consists of:

- **Legal State Machine**: Manages phases of legal review (Discovery, Analysis, Decision, etc.)
- **Event System**: Handles legal events like evidence submission, deadline notifications, and status changes
- **Domain Models**: Legal-specific data structures for cases, evidence, deadlines, and risk factors
- **Event Generators**: Realistic generators for various legal events with proper timing

## Dependencies

- `mobx-state-tree`: State management for complex legal data structures
- `@sim-generator/lib`: Core simulation framework

## Development

This package is part of the simulators monorepo and uses the shared simulation framework from `@sim-generator/lib`.