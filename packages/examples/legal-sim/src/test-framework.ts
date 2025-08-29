/**
 * Test script for the new framework-based legal simulation
 */

import { 
  createLegalReviewMachine, 
  LEGAL_EVENT_GENERATORS, 
  startRealtimeFeed,
  LegalReviewStateMachine 
} from './legal-sim-framework';
import { handleExit } from '../../../lib/src/lib.js';

console.log('Testing the new framework-based legal simulation...\n');

// Create a legal review machine with the same configuration as main.ts
const machine = createLegalReviewMachine({
  file: { 
    matterId: "MAT-2025-VA-042", 
    clientName: "Blue Ridge Tools, Inc.", 
    jurisdiction: "US-EDVA", 
    practiceArea: "Commercial" 
  },
});

console.log('Initial state:', machine.currentState);
console.log('Initial summary:', machine.summary);
console.log('\nStarting realtime feed...\n');

// Start the realtime feed with event generators
const stop = startRealtimeFeed(machine, {
  eventGenerators: LEGAL_EVENT_GENERATORS,
  enableLogging: true,
  onEventProcessed: (event) => {
    const summary = machine.summary;
    console.log(`[${new Date().toLocaleTimeString()}] Processed ${String(event.type)}`);
    console.log(`  Phase: ${summary.phase}`);
    console.log(`  Risk Score: ${summary.riskScore}`);
    console.log(`  Open Tasks: ${summary.openTasks}`);
    console.log(`  Open Issues: ${summary.issuesOpen}`);
    console.log(`  Next Deadline: ${summary.nextDeadline ?? '—'}`);
    console.log('');
  }
});

// Set up exit handling
handleExit(stop);

console.log('Simulation started. Press Ctrl+C to stop.');

// Test manual event injection after a delay
setTimeout(() => {
  console.log('\n--- Injecting test event manually ---');
  machine.processEvent({
    id: 'test-event',
    type: 'email_received' as any,
    timestamp: new Date().toISOString(),
    payload: {
      from: 'test@example.com',
      subject: 'Test Email for Framework',
      body: 'This is a test to verify the framework integration works correctly.'
    }
  });
}, 3000);