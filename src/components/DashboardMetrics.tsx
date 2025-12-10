"use client";

import React from "react";

import { TrendingDown, TrendingUp } from "lucide-react";

export default function DashboardMetrics() {
  const metrics = [
    { 
      title: "Margin Available", 
      value: "₹2,52,780", 
      subtitle: "Available to Trade", 
      icon: "lucide:pie-chart",
      trend: "neutral"
    },
    { 
      title: "Current M2M", 
      value: "₹12,580", 
      subtitle: "Mark-to-market value", 
      icon: "lucide:bar-chart-3",
      trend: "up",
      trendValue: "5.7%"
    },
    { 
      title: "Realized P&L", 
      value: "₹45,620", 
      subtitle: "This month", 
      icon: "lucide:target",
      trend: "up",
      trendValue: "12.4%"
    },
    // Example extra metrics (uncomment if needed)
    // { 
    //   title: "Active Strategies", 
    //   value: 8, 
    //   subtitle: "Running strategies", 
    //   icon: "lucide:calendar",
    //   trend: "up",
    //   trendValue: "+2"
    // },
    // { 
    //   title: "Closed Strategies", 
    //   value: 12, 
    //   subtitle: "Completed strategies", 
    //   icon: "lucide:check-circle",
    //   trend: "neutral"
    // },
    // { 
    //   title: "Open Positions", 
    //   value: 24, 
    //   subtitle: "All legs included", 
    //   icon: "lucide:briefcase",
    //   trend: "down",
    //   trendValue: "-3"
    // },
    // { 
    //   title: "Closed Positions", 
    //   value: 36, 
    //   subtitle: "Completed positions", 
    //   icon: "lucide:file-text",
    //   trend: "up",
    //   trendValue: "+8"
    // },
  ];

  return (
    <div className="grid bg-base-100 grid-cols-2 rounded-xl sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => {
        const trendColor =
          metric.trend === "up"
            ? "text-success"
            : metric.trend === "down"
            ? "text-error"
            : "text-info";

        return (
          <div key={index} className="stats overflow-hidden">
            <div className="stat p-4">
              {/* Icon block (optional) */}
              {/* <div className="stat-figure mt-2">
                <div className="p-3 rounded-full bg-primary/5 ring-1 ring-primary/10">
                  <Icon icon={metric.icon} width={24} height={24} className="text-primary" />
                </div>
              </div> */}

              <div className="stat-title text-sm font-medium text-base-content/60 uppercase tracking-wide">
                {metric.title}
              </div>
              <div className="stat-value text-2xl font-bold mt-1">{metric.value}</div>

              <div className="stat-desc flex items-center justify-between mt-2">
                <span className="text-xs text-base-content/70">{metric.subtitle}</span>
                {metric.trendValue && (
                  <span
                    className={`flex items-center text-sm font-medium ${trendColor}`}
                  >
                    {metric.trend === "up" ? (
                      <TrendingUp width={16} height={16} className="mr-1" />
                    ) : metric.trend === "down" ? (
                      <TrendingDown width={16} height={16} className="mr-1" />
                    ) : null}
                    {metric.trendValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
