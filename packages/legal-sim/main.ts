import { createLegalReviewMachine, startRealtimeFeed, LEGAL_EVENT_GENERATORS } from "./src/legal-sim-framework.js";
import { handleExit } from "../lib/src/lib.js";

const machine = createLegalReviewMachine({
  file: { matterId: "MAT-2025-VA-042", clientName: "Blue Ridge Tools, Inc.", jurisdiction: "US-EDVA", practiceArea: "Commercial" },
});

const stop = startRealtimeFeed(machine, {
  eventGenerators: LEGAL_EVENT_GENERATORS,
  enableLogging: true,
  onEventProcessed: (event) => {
    const summary = machine.summary;
    console.log(`[${new Date().toLocaleTimeString()}] Injected ${String(event.type)}. Phase=${summary.phase}, Risk=${summary.riskScore}, OpenTasks=${summary.openTasks}, NextDDL=${summary.nextDeadline ?? "—"}`);
  }
});

handleExit(stop);