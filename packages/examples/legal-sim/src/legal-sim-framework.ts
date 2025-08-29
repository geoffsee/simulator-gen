/**
 * Legal Simulation implemented using the generic simulation framework
 */

import {
  BaseStateMachine,
  SimulationEngine,
  Event,
  EventGenerator,
  StateMachineConfig,
  nextId,
  nowISO,
  pick,
  rand,
  clamp01,
  daysFromNow,
  startRealtimeFeed
} from '@sim-generator/lib';

// ---------- Legal Domain Types ----------

export enum LegalPhase {
  Initial = 'Initial',
  ConflictsCheck = 'ConflictsCheck',
  FileIntake = 'FileIntake',
  IssueSpotting = 'IssueSpotting',
  Research = 'Research',
  Analysis = 'Analysis',
  Strategy = 'Strategy',
  Drafting = 'Drafting',
  ClientComms = 'ClientComms',
  Waiting = 'Waiting',
  Review = 'Review',
  Complete = 'Complete'
}

export enum LegalEventType {
  EmailReceived = 'email_received',
  DocUploaded = 'doc_uploaded',
  HearingSet = 'hearing_set',
  OppositionMotion = 'opposition_motion',
  ClientCall = 'client_call',
  CourtNotice = 'court_notice',
  PaymentIssue = 'payment_issue',
  ConflictFlag = 'conflict_flag',
  CalendarUpdate = 'calendar_update'
}

export interface LegalEvent extends Event<LegalEventType, any> {}

export interface ClientFile {
  matterId: string;
  clientName: string;
  jurisdiction: string;
  practiceArea: string;
}

export interface Fact {
  id: string;
  text: string;
  source: string;
  confidence: number;
  timestamp: string;
}

export interface Issue {
  id: string;
  label: string;
  description: string;
  priority: number;
  status: 'open' | 'investigating' | 'resolved';
}

export interface Task {
  id: string;
  title: string;
  domain: string;
  status: 'todo' | 'doing' | 'blocked' | 'done';
  createdAt: string;
  dueISO: string | null;
  notes: string;
}

export interface Deadline {
  id: string;
  label: string;
  dateISO: string;
  isHard: boolean;
  done: boolean;
}

export interface Evidence {
  id: string;
  kind: string;
  description: string;
  uri: string | null;
  receivedAt: string;
}

export interface RiskAssessment {
  confidentiality: number;
  deadline: number;
  adversarial: number;
  compliance: number;
}

export interface LegalReviewState {
  file: ClientFile;
  facts: Fact[];
  issues: Issue[];
  deadlines: Deadline[];
  evidence: Evidence[];
  tasks: Task[];
  events: LegalEvent[];
  notes: string[];
  risk: RiskAssessment;
}

// ---------- Legal State Machine ----------

export class LegalReviewStateMachine extends BaseStateMachine<LegalPhase, LegalEvent> {
  private state: LegalReviewState;

  constructor(config: { file?: Partial<ClientFile> }) {
    const allowedTransitions: Record<string, string[]> = {
      [LegalPhase.Initial]: [LegalPhase.ConflictsCheck, LegalPhase.FileIntake],
      [LegalPhase.ConflictsCheck]: [LegalPhase.FileIntake, LegalPhase.Waiting],
      [LegalPhase.FileIntake]: [LegalPhase.IssueSpotting, LegalPhase.Research],
      [LegalPhase.IssueSpotting]: [LegalPhase.Research, LegalPhase.Analysis],
      [LegalPhase.Research]: [LegalPhase.Analysis, LegalPhase.Strategy],
      [LegalPhase.Analysis]: [LegalPhase.Strategy, LegalPhase.Drafting, LegalPhase.ClientComms],
      [LegalPhase.Strategy]: [LegalPhase.Drafting, LegalPhase.ClientComms, LegalPhase.Review],
      [LegalPhase.Drafting]: [LegalPhase.ClientComms, LegalPhase.Review, LegalPhase.Waiting],
      [LegalPhase.ClientComms]: [LegalPhase.Analysis, LegalPhase.Strategy, LegalPhase.Review, LegalPhase.Waiting],
      [LegalPhase.Waiting]: [LegalPhase.ClientComms, LegalPhase.Review, LegalPhase.Drafting],
      [LegalPhase.Review]: [LegalPhase.Complete, LegalPhase.ClientComms, LegalPhase.Drafting],
      [LegalPhase.Complete]: []
    };

    super({
      initialState: LegalPhase.Initial,
      allowedTransitions,
      enableLogging: false
    });

    this.state = {
      file: {
        matterId: config.file?.matterId ?? "MAT-0001",
        clientName: config.file?.clientName ?? "Acme Widgets, LLC",
        jurisdiction: config.file?.jurisdiction ?? "VA",
        practiceArea: config.file?.practiceArea ?? "Contracts"
      },
      facts: [],
      issues: [],
      deadlines: [],
      evidence: [],
      tasks: [],
      events: [],
      notes: [],
      risk: {
        confidentiality: 0.1,
        deadline: 0.2,
        adversarial: 0.15,
        compliance: 0.05
      }
    };
  }

  protected handleEvent(event: LegalEvent): void {
    this.state.events.push(event);
    this.processLegalEvent(event);
    this.deriveIssuesFromFacts();
    this.updateRisk();
  }

  private processLegalEvent(event: LegalEvent): void {
    switch (event.type) {
      case LegalEventType.EmailReceived:
        this.handleEmailReceived(event);
        break;
      case LegalEventType.DocUploaded:
        this.handleDocUploaded(event);
        break;
      case LegalEventType.HearingSet:
        this.handleHearingSet(event);
        break;
      case LegalEventType.OppositionMotion:
        this.handleOppositionMotion(event);
        break;
      case LegalEventType.ClientCall:
        this.handleClientCall(event);
        break;
      case LegalEventType.CourtNotice:
        this.handleCourtNotice(event);
        break;
      case LegalEventType.PaymentIssue:
        this.handlePaymentIssue(event);
        break;
      case LegalEventType.ConflictFlag:
        this.handleConflictFlag(event);
        break;
      case LegalEventType.CalendarUpdate:
        this.handleCalendarUpdate(event);
        break;
    }
  }

  private handleEmailReceived(event: LegalEvent): void {
    const { from, subject, body } = event.payload;
    this.addFact(`Email from ${from}: ${subject}`, "client_email", 0.7);
    if (/question|clarify|unknown/i.test(body ?? "")) {
      this.addTask("Draft clarifying questions for client", "client", 1);
      this.transition(LegalPhase.ClientComms);
    }
    this.addEvidence("email", `Email: ${subject} (from ${from})`);
    this.decayRisk(0.995);
  }

  private handleDocUploaded(event: LegalEvent): void {
    const { name, uri, summary } = event.payload;
    this.addEvidence("document", `Uploaded: ${name}`, uri ?? null);
    this.addFact(`New document uploaded: ${name}`, `document:${name}`, 0.8);
    this.addTask(`Review ${name}`, "analysis", 2, summary ? `Summary: ${summary}` : undefined);
    this.transition(LegalPhase.IssueSpotting);
  }

  private handleHearingSet(event: LegalEvent): void {
    const { dateISO, courtroom } = event.payload;
    this.addDeadline(`Hearing (${courtroom ?? "TBD"})`, dateISO ?? daysFromNow(14), true);
    this.addTask("Prepare hearing outline & exhibits list", "drafting", 7);
    this.bumpRisk("deadline", 0.25);
    this.transition(LegalPhase.Strategy);
  }

  private handleOppositionMotion(event: LegalEvent): void {
    const { rule, relief } = event.payload;
    this.addIssue(`Opposition motion (${rule ?? "Rule ?"})`, `Seeks ${relief ?? "unspecified relief"}`, 5);
    this.addTask("Research opposition's motion & draft response", "research", 3);
    this.bumpRisk("adversarial", 0.25);
    this.transition(LegalPhase.Research);
  }

  private handleClientCall(event: LegalEvent): void {
    const { notes } = event.payload;
    this.addFact(`Client call notes: ${notes}`, "client_call", 0.75);
    this.addTask("Send summary of call & action items", "client", 1);
    this.decayRisk(0.98);
    this.transition(LegalPhase.Analysis);
  }

  private handleCourtNotice(event: LegalEvent): void {
    const { message, daysToRespond } = event.payload;
    this.addFact(`Court notice: ${message}`, "court_notice", 0.9);
    this.addDeadline("Respond to court notice", daysFromNow(Math.max(1, daysToRespond ?? 7)), true);
    this.addTask("Draft response to court notice", "drafting", Math.max(1, (daysToRespond ?? 7) - 1));
    this.bumpRisk("deadline", 0.2);
    this.transition(LegalPhase.Drafting);
  }

  private handlePaymentIssue(event: LegalEvent): void {
    this.addIssue("Billing / payment risk", "Payment irregularity flagged.", 3);
    this.bumpRisk("compliance", 0.05);
  }

  private handleConflictFlag(event: LegalEvent): void {
    this.addIssue("Potential conflict of interest", "Conflict flag raised. Verify.", 5);
    this.addTask("Run full conflicts check", "other", 1);
    this.transition(LegalPhase.ConflictsCheck);
  }

  private handleCalendarUpdate(event: LegalEvent): void {
    const { label, deltaDays } = event.payload;
    this.addFact(`Calendar update: ${label} shifted by ${deltaDays}d`, "calendar", 0.8);
    this.bumpRisk("deadline", deltaDays < 0 ? 0.1 : -0.05);
  }

  // Helper methods for managing state
  private addFact(text: string, source: string, confidence = 0.6): void {
    this.state.facts.push({
      id: nextId("fact"),
      text,
      source,
      confidence,
      timestamp: nowISO()
    });
  }

  private addIssue(label: string, description = "", priority = 3): void {
    this.state.issues.push({
      id: nextId("issue"),
      label,
      description,
      priority,
      status: "open"
    });
  }

  private addTask(title: string, domain: string, dueDays?: number, notes?: string): void {
    this.state.tasks.push({
      id: nextId("task"),
      title,
      domain,
      status: "todo",
      createdAt: nowISO(),
      dueISO: dueDays != null ? daysFromNow(dueDays) : null,
      notes: notes ?? ""
    });
  }

  private addDeadline(label: string, dateISO: string, isHard = true): void {
    this.state.deadlines.push({
      id: nextId("ddl"),
      label,
      dateISO,
      isHard,
      done: false
    });
  }

  private addEvidence(kind: string, description: string, uri?: string | null): void {
    this.state.evidence.push({
      id: nextId("ev"),
      kind,
      description,
      uri: uri ?? null,
      receivedAt: nowISO()
    });
  }

  private bumpRisk(type: keyof RiskAssessment, delta: number): void {
    this.state.risk[type] = clamp01(this.state.risk[type] + delta);
  }

  private decayRisk(factor = 0.98): void {
    this.state.risk.confidentiality = clamp01(this.state.risk.confidentiality * factor);
    this.state.risk.deadline = clamp01(this.state.risk.deadline * factor);
    this.state.risk.adversarial = clamp01(this.state.risk.adversarial * factor);
    this.state.risk.compliance = clamp01(this.state.risk.compliance * factor);
  }

  private deriveIssuesFromFacts(): void {
    const factText = this.state.facts.map((f) => f.text.toLowerCase()).join(" | ");
    if (factText.includes("deadline") || factText.includes("hearing")) {
      this.addIssue("Time-sensitive procedural step", "Detected time-sensitive fact(s) requiring scheduling.", 4);
      this.addTask("Confirm all calendared deadlines", "filing", 2);
      this.bumpRisk("deadline", 0.1);
    }
    if (factText.includes("confidential") || factText.includes("nda")) {
      this.addIssue("Confidentiality constraints", "NDA/confidential material handling.", 3);
      this.bumpRisk("confidentiality", 0.05);
    }
  }

  private updateRisk(): void {
    // Decay risk over time
    this.decayRisk(0.999);

    // Check for overdue tasks
    const now = Date.now();
    if (this.state.tasks.some((t) => t.dueISO && new Date(t.dueISO).getTime() < now && t.status !== "done")) {
      this.bumpRisk("deadline", 0.05);
    }

    // Check for high priority unresolved issues
    const highOpenIssues = this.state.issues.filter((i) => i.status !== "resolved" && i.priority >= 4).length;
    if (highOpenIssues >= 3) {
      this.bumpRisk("adversarial", 0.05);
    }
  }

  public get summary(): {
    phase: LegalPhase;
    issuesOpen: number;
    riskScore: string;
    nextDeadline: string | null;
    openTasks: number;
  } {
    const riskScore = (0.15 * this.state.risk.confidentiality + 
                      0.45 * this.state.risk.deadline + 
                      0.3 * this.state.risk.adversarial + 
                      0.1 * this.state.risk.compliance);

    const nextDeadline = this.state.deadlines
      .filter((d) => !d.done)
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())[0];

    return {
      phase: this.currentState,
      issuesOpen: this.state.issues.filter((i) => i.status !== "resolved").length,
      riskScore: riskScore.toFixed(2),
      nextDeadline: nextDeadline ? nextDeadline.dateISO : null,
      openTasks: this.state.tasks.filter((t) => t.status !== "done").length
    };
  }
}

// ---------- Event Generators ----------

export const LEGAL_EVENT_GENERATORS: EventGenerator<LegalEvent>[] = [
  () => ({
    id: nextId('evt'),
    type: LegalEventType.EmailReceived,
    timestamp: nowISO(),
    payload: {
      from: pick(["client@acme.com", "opposing@lawfirm.com", "paralegal@yourfirm.com"]),
      subject: pick(["Question about contract clause 7.3", "Follow-up docs attached", "Clarification on timeline"]),
      body: pick([
        "Can you clarify the indemnity language?",
        "Attaching the signed NDA and vendor SOW.",
        "I think the date might be wrong—can you confirm?"
      ])
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.DocUploaded,
    timestamp: nowISO(),
    payload: {
      name: pick(["Master_Services_Agreement.pdf", "Change_Order_02.docx", "Email_Thread_Export.mbox"]),
      uri: "/uploads/" + Math.random().toString(36).slice(2) + ".bin",
      summary: pick([
        "Contains original scope and limitation of liability.",
        "Revises delivery dates and adds late fees.",
        "Thread about notice of breach in March."
      ])
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.HearingSet,
    timestamp: nowISO(),
    payload: {
      dateISO: daysFromNow(rand(5, 21)),
      courtroom: pick(["EDVA-4B", "Norfolk-3C", "Richmond-2A"])
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.OppositionMotion,
    timestamp: nowISO(),
    payload: {
      rule: pick(["FRCP 12(b)(6)", "FRCP 56", "Va. Sup. Ct. R. 4:12"]),
      relief: pick(["dismiss complaint", "summary judgment", "protective order"])
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.ClientCall,
    timestamp: nowISO(),
    payload: {
      notes: pick([
        "Client confirms delivery occurred on April 12; notice sent April 15.",
        "New witness: shipping manager available for affidavit.",
        "Client prefers settlement window under $50k."
      ])
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.CourtNotice,
    timestamp: nowISO(),
    payload: {
      message: pick(["Chambers requests status update", "Defect in service noted", "Schedule for pretrial conference"]),
      daysToRespond: rand(3, 10)
    }
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.PaymentIssue,
    timestamp: nowISO(),
    payload: {}
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.ConflictFlag,
    timestamp: nowISO(),
    payload: {}
  }),
  () => ({
    id: nextId('evt'),
    type: LegalEventType.CalendarUpdate,
    timestamp: nowISO(),
    payload: {
      label: pick(["Disclosure deadline", "Exhibit list due", "Motions in limine"]),
      deltaDays: rand(-3, 4)
    }
  })
];

// ---------- Factory Functions ----------

export function createLegalReviewMachine(config?: { file?: Partial<ClientFile> }): LegalReviewStateMachine {
  return new LegalReviewStateMachine(config ?? {});
}

export { startRealtimeFeed };