import { Agent, run } from '@openai/agents';
import {
  EventDesignRequest,
  EventDesign,
  EventTypeDefinition,
  EventGeneratorDefinition,
  EventHandlerDefinition,
  EventFlowDefinition,
  EventCategory,
  EventFrequency,
  EventPriority,
  SystemType
} from './types.js';

export class EventDesigner {
  private eventDesignAgent: Agent;

  constructor() {
    this.eventDesignAgent = new Agent({
      name: 'EventDesigner',
      instructions: `
        You are an expert event system designer for simulations. You create realistic
        event systems with proper event types, generators, handlers, and flows.
        
        Design events that:
        1. Are realistic for the domain
        2. Have appropriate frequencies and priorities
        3. Include meaningful payloads
        4. Support the designed state machine
        5. Create interesting simulation dynamics
      `
    });
  }

  async design(request: EventDesignRequest): Promise<EventDesign> {
    try {
      // For MVP, create a basic event design based on template and analysis
      return this.createBasicEventDesign(request);
    } catch (error) {
      console.warn('Event design failed, using fallback:', error);
      return this.createFallbackEventDesign(request);
    }
  }

  private createBasicEventDesign(request: EventDesignRequest): EventDesign {
    // Decide event names based on system type
    let eventNames = request.template.commonEvents;
    if (request.analysis.systemType === SystemType.FINANCIAL) {
      eventNames = [
        'donation_received',
        'pac_contribution',
        'fec_report_filed',
        'state_limit_breached',
        'matching_funds_applied',
        'refund_issued',
        'transfer_between_committees',
        'ad_spend_reported',
        'compliance_review_passed',
        'audit_flagged'
      ];
    }

    const eventTypes: EventTypeDefinition[] = eventNames.map((eventName, index) => ({
      name: eventName,
      description: `${eventName} event in the ${request.analysis.systemType} system`,
      category: this.inferEventCategory(eventName),
      payload: this.getEventPayload(eventName),
      frequency: this.inferEventFrequency(eventName, index),
      priority: this.inferEventPriority(eventName),
      triggers: [`user_action_${eventName}`, `system_trigger_${eventName}`]
    }));

    const eventGenerators: EventGeneratorDefinition[] = eventTypes.map(eventType => ({
      eventType: eventType.name,
      generationLogic: {
        type: 'random',
        parameters: {
          minInterval: this.getIntervalForFrequency(eventType.frequency).min,
          maxInterval: this.getIntervalForFrequency(eventType.frequency).max,
          probability: this.getProbabilityForFrequency(eventType.frequency)
        }
      },
      constraints: [
        { type: 'frequency', value: eventType.frequency, description: `Generate with ${eventType.frequency} frequency` }
      ]
    }));

    const eventHandlers: EventHandlerDefinition[] = eventTypes.map(eventType => ({
      eventType: eventType.name,
      handlerName: `handle${this.capitalize(eventType.name)}`,
      actions: [
        { type: 'logMessage', parameters: { message: `Processing ${eventType.name} event` } },
        { type: 'updateState', parameters: { property: 'lastEvent', value: eventType.name } }
      ],
      stateTransitions: this.getStateTransitionsForEvent(eventType.name, request)
    }));

    const eventFlows: EventFlowDefinition[] = this.createBasicEventFlows(eventTypes);

    return {
      eventTypes,
      eventGenerators,
      eventHandlers,
      eventFlows
    };
  }

  private createFallbackEventDesign(request: EventDesignRequest): EventDesign {
    const basicEventTypes: EventTypeDefinition[] = [
      {
        name: 'start',
        description: 'System start event',
        category: EventCategory.SYSTEM,
        payload: [{ name: 'timestamp', type: 'string' }],
        frequency: EventFrequency.RARE,
        priority: EventPriority.HIGH,
        triggers: ['system_init']
      },
      {
        name: 'process',
        description: 'Processing event',
        category: EventCategory.SYSTEM,
        payload: [{ name: 'data', type: 'object' }],
        frequency: EventFrequency.FREQUENT,
        priority: EventPriority.MEDIUM,
        triggers: ['data_available']
      },
      {
        name: 'complete',
        description: 'Completion event',
        category: EventCategory.SYSTEM,
        payload: [{ name: 'result', type: 'object' }],
        frequency: EventFrequency.OCCASIONAL,
        priority: EventPriority.HIGH,
        triggers: ['task_finished']
      }
    ];

    return {
      eventTypes: basicEventTypes,
      eventGenerators: basicEventTypes.map(et => ({
        eventType: et.name,
        generationLogic: { type: 'random', parameters: { probability: 0.3 } },
        constraints: []
      })),
      eventHandlers: basicEventTypes.map(et => ({
        eventType: et.name,
        handlerName: `handle${this.capitalize(et.name)}`,
        actions: [{ type: 'logMessage', parameters: { message: `Handling ${et.name}` } }],
        stateTransitions: []
      })),
      eventFlows: []
    };
  }

  private inferEventCategory(eventName: string): EventCategory {
    const lower = eventName.toLowerCase();
    if (lower.includes('user') || lower.includes('click') || lower.includes('input')) {
      return EventCategory.USER_ACTION;
    }
    if (lower.includes('error') || lower.includes('fail')) {
      return EventCategory.ERROR;
    }
    if (lower.includes('timer') || lower.includes('schedule')) {
      return EventCategory.TIMER;
    }
    if (lower.includes('notify') || lower.includes('alert')) {
      return EventCategory.NOTIFICATION;
    }
    if (lower.includes('external') || lower.includes('api')) {
      return EventCategory.EXTERNAL;
    }
    return EventCategory.SYSTEM;
  }

  private inferEventFrequency(eventName: string, index: number): EventFrequency {
    const lower = eventName.toLowerCase();
    if (lower.includes('start') || lower.includes('init') || lower.includes('complete')) {
      return EventFrequency.RARE;
    }
    if (lower.includes('error') || lower.includes('fail')) {
      return EventFrequency.VERY_RARE;
    }
    if (lower.includes('process') || lower.includes('update')) {
      return EventFrequency.FREQUENT;
    }
    return EventFrequency.OCCASIONAL;
  }

  private inferEventPriority(eventName: string): EventPriority {
    const lower = eventName.toLowerCase();
    if (lower.includes('error') || lower.includes('critical') || lower.includes('urgent')) {
      return EventPriority.CRITICAL;
    }
    if (lower.includes('important') || lower.includes('start') || lower.includes('complete')) {
      return EventPriority.HIGH;
    }
    if (lower.includes('info') || lower.includes('debug')) {
      return EventPriority.LOW;
    }
    return EventPriority.MEDIUM;
  }

  private getEventPayload(eventName: string) {
    const basePayload = [
      { name: 'id', type: 'string', description: 'Event ID' },
      { name: 'timestamp', type: 'string', description: 'Event timestamp' }
    ];

    const lower = eventName.toLowerCase();

    // Campaign finance specific payloads
    if (lower.includes('donation') || lower.includes('contribution')) {
      basePayload.push(
        { name: 'amount', type: 'number', description: 'Contribution amount (USD)' },
        { name: 'donorType', type: 'string', description: 'individual | pac | party | other' },
        { name: 'jurisdiction', type: 'string', description: 'federal | state | local' },
        { name: 'committeeId', type: 'string', description: 'Committee identifier' },
        { name: 'candidateId', type: 'string', description: 'Candidate identifier' }
      );
    }
    if (lower.includes('fec') || lower.includes('report')) {
      basePayload.push(
        { name: 'periodStart', type: 'string', description: 'Reporting period start' },
        { name: 'periodEnd', type: 'string', description: 'Reporting period end' },
        { name: 'totalRaised', type: 'number', description: 'Total raised in period' },
        { name: 'totalSpent', type: 'number', description: 'Total spent in period' }
      );
    }
    if ((lower.includes('limit') && (lower.includes('breach') || lower.includes('breached') || lower.includes('exceed')))) {
      basePayload.push(
        { name: 'limit', type: 'number', description: 'Applicable contribution limit' },
        { name: 'amount', type: 'number', description: 'Contribution amount that exceeded the limit' },
        { name: 'jurisdiction', type: 'string', description: 'federal | state | local' }
      );
    }
    if (lower.includes('match')) {
      basePayload.push(
        { name: 'matchRate', type: 'number', description: 'Matching funds rate' },
        { name: 'amountMatched', type: 'number', description: 'Amount matched' }
      );
    }
    if (lower.includes('ad') && lower.includes('spend')) {
      basePayload.push(
        { name: 'mediaType', type: 'string', description: 'tv | radio | digital | print' },
        { name: 'market', type: 'string', description: 'Media market' },
        { name: 'amount', type: 'number', description: 'Spend amount' }
      );
    }
    if (lower.includes('audit')) {
      basePayload.push(
        { name: 'reason', type: 'string', description: 'Audit reason or flag' }
      );
    }
    if (lower.includes('transfer')) {
      basePayload.push(
        { name: 'fromCommitteeId', type: 'string', description: 'Source committee' },
        { name: 'toCommitteeId', type: 'string', description: 'Destination committee' },
        { name: 'amount', type: 'number', description: 'Transfer amount' }
      );
    }
    if (lower.includes('compliance')) {
      basePayload.push(
        { name: 'status', type: 'string', description: 'passed | failed | needs_review' },
        { name: 'reviewer', type: 'string', description: 'Compliance reviewer' }
      );
    }
    if (lower.includes('refund')) {
      basePayload.push(
        { name: 'amount', type: 'number', description: 'Refund amount' },
        { name: 'reason', type: 'string', description: 'Refund reason' }
      );
    }

    // Generic payload enrichments
    if (lower.includes('user') || lower.includes('client')) {
      basePayload.push({ name: 'userId', type: 'string', description: 'User identifier' });
    }
    if (lower.includes('data') || lower.includes('process')) {
      basePayload.push({ name: 'data', type: 'object', description: 'Event data' });
    }
    if (lower.includes('error')) {
      basePayload.push({ name: 'error', type: 'string', description: 'Error message' });
    }

    return basePayload;
  }

  private getIntervalForFrequency(frequency: EventFrequency): { min: number; max: number } {
    switch (frequency) {
      case EventFrequency.VERY_FREQUENT: return { min: 100, max: 500 };
      case EventFrequency.FREQUENT: return { min: 1000, max: 3000 };
      case EventFrequency.OCCASIONAL: return { min: 3000, max: 10000 };
      case EventFrequency.RARE: return { min: 10000, max: 30000 };
      case EventFrequency.VERY_RARE: return { min: 30000, max: 60000 };
    }
  }

  private getProbabilityForFrequency(frequency: EventFrequency): number {
    switch (frequency) {
      case EventFrequency.VERY_FREQUENT: return 0.8;
      case EventFrequency.FREQUENT: return 0.6;
      case EventFrequency.OCCASIONAL: return 0.4;
      case EventFrequency.RARE: return 0.2;
      case EventFrequency.VERY_RARE: return 0.1;
    }
  }

  private getStateTransitionsForEvent(eventName: string, request: EventDesignRequest): string[] {
    const states = request.stateDesign.states.map(s => s.name);
    const transitions = request.stateDesign.transitions
      .filter(t => t.trigger.toLowerCase().includes(eventName.toLowerCase()))
      .map(t => `${t.from} -> ${t.to}`);
    
    return transitions.length > 0 ? transitions : [];
  }

  private createBasicEventFlows(eventTypes: EventTypeDefinition[]): EventFlowDefinition[] {
    if (eventTypes.length < 2) return [];

    return [
      {
        name: 'BasicFlow',
        description: 'Basic event flow through the system',
        startEvent: eventTypes[0].name,
        endEvent: eventTypes[eventTypes.length - 1].name,
        steps: eventTypes.map(et => ({
          eventType: et.name,
          conditions: [],
          nextSteps: eventTypes.filter(next => next !== et).map(next => next.name)
        }))
      }
    ];
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}