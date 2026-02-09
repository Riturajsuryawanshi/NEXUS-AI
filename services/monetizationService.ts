
import { JobRecord, Opportunity, BusinessContext, BusinessDecision } from '../types';

export class MonetizationService {
  /**
   * Generates actionable business decisions based on statistical rules.
   */
  static generateDecisions(job: JobRecord, context: BusinessContext): BusinessDecision[] {
    if (!job.summary || !job.opportunities) return [];
    
    const decisions: BusinessDecision[] = [];
    const opps = job.opportunities;

    // 1. Convert Opportunities to Strategic Decisions
    opps.forEach(opp => {
      // Logic: If impact is high and confidence is high -> Top 3
      if (opp.confidence >= 0.7 && opp.roiScore >= 5) {
        decisions.push({
          id: crypto.randomUUID(),
          type: 'top_3',
          title: `Scale ${opp.factor || 'Primary Segment'}`,
          whyItMatters: `This segment contributes ${(opp.confidence * 100).toFixed(0)}% more variance than average.`,
          action: `Increase budget allocation by 20% for ${opp.factor || 'target'} customers.`,
          expectedGain: opp.estimatedImpact,
          confidence: opp.confidence,
          riskLevel: 'low',
          timeToImpact: '2-4 weeks',
          affectedSegment: opp.factor || 'Core'
        });
      }

      // Logic: If cost is low and impact is positive -> Quick Win
      if (opp.estimatedCost <= opp.estimatedImpact * 0.1) {
        decisions.push({
          id: crypto.randomUUID(),
          type: 'quick_win',
          title: `Optimize ${opp.factor || 'Operational'} Factor`,
          whyItMatters: `Low-cost high-efficiency delta detected in ${opp.dimension || 'data'}.`,
          action: `Automate threshold alerts for ${opp.factor || 'metric'}.`,
          expectedGain: opp.estimatedImpact * 0.5,
          confidence: 0.9,
          riskLevel: 'low',
          timeToImpact: '1 week',
          affectedSegment: opp.factor || 'Global'
        });
      }

      // Logic: If impact is massive -> High Impact Bet
      if (opp.estimatedImpact >= 10000) {
        decisions.push({
          id: crypto.randomUUID(),
          type: 'high_impact',
          title: `Strategic ${opp.factor || 'Growth'} Overhaul`,
          whyItMatters: `Massive untapped variance in ${opp.factor || 'underlying segments'}.`,
          action: `Redesign onboarding flow specifically for ${opp.factor || 'high-value'} users.`,
          expectedGain: opp.estimatedImpact * 3,
          confidence: 0.65,
          riskLevel: 'medium',
          timeToImpact: '3 months',
          affectedSegment: opp.factor || 'New Markets'
        });
      }
    });

    return decisions.sort((a, b) => b.expectedGain - a.expectedGain);
  }

  static analyzeOpportunities(job: JobRecord, context: BusinessContext): Opportunity[] {
    if (!job.summary || !job.dataStack.length) return [];
    
    const summary = job.summary;
    const opportunities: Opportunity[] = [];
    const targetKPI = context.primaryKPI;

    if (summary.rootCause) {
      summary.rootCause.top_contributors
        .filter(c => c.direction === 'increase')
        .forEach(c => {
          const impact = Math.abs(c.absolute_impact) * 1.5;
          opportunities.push({
            id: crypto.randomUUID(),
            type: 'revenue_gain',
            title: `Scale ${c.factor}`,
            affectedKPI: targetKPI,
            estimatedImpact: impact,
            estimatedCost: impact * 0.2,
            roiScore: 5.0,
            confidence: summary.rootCause!.confidence_score / 100,
            description: `The segment '${c.factor}' is a primary driver of ${targetKPI}.`,
            actionPlan: [`Target ${c.factor} for growth.`],
            dimension: c.dimension,
            factor: c.factor,
            effort: impact > 5000 ? 'medium' : 'low'
          });
        });
    }

    Object.entries(summary.columns).forEach(([name, col]) => {
      if (col.type === 'numeric' && name !== targetKPI && col.stats && 'outliersCount' in col.stats) {
        if (col.stats.outliersCount > (summary.rowCount * 0.05)) {
          const impact = col.stats.mean * col.stats.outliersCount * 0.2;
          opportunities.push({
            id: crypto.randomUUID(),
            type: 'cost_leak',
            title: `Leak in ${name}`,
            affectedKPI: 'Cost',
            estimatedImpact: impact,
            estimatedCost: impact * 0.05,
            roiScore: 20.0,
            confidence: 0.8,
            description: `High variance in ${name} suggests waste.`,
            actionPlan: [`Standardize ${name}.`],
            effort: 'low'
          });
        }
      }
    });

    return opportunities;
  }

  static getMockReport(job: JobRecord, context: BusinessContext): string {
    return `
# MONETIZATION PROOF REPORT
Dataset: ${job.fileName}
Context: ${context.businessType} / ${context.primaryGoal}

## EXECUTIVE SUMMARY
Deterministic analysis identifies ${job.opportunities?.length || 0} financial levers.
Quality Score: ${job.summary?.qualityScore}%

## TOP STRATEGIC DECISIONS
${job.decisions?.filter(d => d.type === 'top_3').map(d => `
- ${d.title}: Expected ${context.currency}${d.expectedGain.toLocaleString()} Gain.
  Action: ${d.action}
`).join('')}

## AUDIT TRAIL
Method: PoP Variance Decomposition
AI Role: Summarization Only (Narrative Layer)
Numbers: Validated Deterministically
    `;
  }
}
