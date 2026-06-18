"use client";

import { AlertCircle, Info } from "lucide-react";
import type { ResearchReport } from "@/types/research";
import ResearchReportHeader from "./ResearchReportHeader";
import ResearchProbabilityCard from "./ResearchProbabilityCard";
import ResearchOutlookCard from "./ResearchOutlookCard";
import ResearchRiskPanel from "./ResearchRiskPanel";
import ResearchFactorsList from "./ResearchFactorsList";
import ResearchNewsSummary from "./ResearchNewsSummary";
import ResearchMarketDataCard from "./ResearchMarketDataCard";
import ResearchTechnicalAnalysis from "./ResearchTechnicalAnalysis";
import ResearchAgentInsights from "./ResearchAgentInsights";

type Props = {
  report: ResearchReport;
};

export default function ResearchReportView({ report }: Props) {
  const isStub =
    report.status === "stub" ||
    report.status === "partial" ||
    (report.probabilities.bullish === 0 &&
      report.probabilities.bearish === 0 &&
      report.probabilities.sideways === 1);

  return (
    <div className="space-y-6">
      <ResearchReportHeader report={report} />

      {isStub ? (
        <div className="alert alert-warning text-sm">
          <Info className="h-5 w-5 shrink-0" aria-hidden />
          <span>
            Data pipeline is not complete for this symbol. Run ingestion, feature
            computation, and model training to get full predictions.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResearchProbabilityCard
          probabilities={report.probabilities}
          confidenceScore={report.confidence_score}
        />
        <ResearchOutlookCard outlook={report.holding_outlook} />
      </div>

      <ResearchRiskPanel
        riskLevel={report.risk_level}
        riskScore={report.risk_score}
        riskRules={report.risk_rules}
      />

      {report.features ? (
        <ResearchTechnicalAnalysis
          features={report.features}
          agentSummary={
            typeof report.agent_insights?.technical?.summary === "string"
              ? report.agent_insights.technical.summary
              : typeof report.agent_insights?.technical?.raw_summary === "string"
                ? report.agent_insights.technical.raw_summary
                : null
          }
        />
      ) : null}

      <ResearchFactorsList
        positives={report.key_positive_factors}
        risks={report.risk_factors}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResearchNewsSummary summary={report.news_summary} />
        {report.market_data ? (
          <ResearchMarketDataCard marketData={report.market_data} />
        ) : (
          <div className="rounded-2xl border border-dashed border-base-300/60 bg-base-200/20 p-6 text-center text-sm text-base-content/55">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-base-content/30" aria-hidden />
            Market data not available for this symbol.
          </div>
        )}
      </div>

      {report.agent_insights ? (
        <ResearchAgentInsights insights={report.agent_insights} />
      ) : null}
    </div>
  );
}
