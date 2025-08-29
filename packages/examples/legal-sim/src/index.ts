/**
 * Legal Simulation - Framework-based Implementation
 * 
 * This is the new implementation using the generic simulation framework.
 * It maintains the same functionality as the original but with better
 * structure and reusability.
 */

// Export the new framework-based implementation
export * from './legal-sim-framework';

// For backward compatibility, also export with the original names
export {
  createLegalReviewMachine,
  startRealtimeFeed,
  LegalReviewStateMachine as ILegalReviewMachine,
  LEGAL_EVENT_GENERATORS
} from './legal-sim-framework';
