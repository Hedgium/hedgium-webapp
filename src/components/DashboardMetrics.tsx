"use client";

import React from "react";


import { 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Target, 
  Calendar, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// interface Metric {
//   title: string;
//   value: string | number;
//   subtitle: string;
//   icon: React.ComponentType;
//   trend?: 'up' | 'down' | 'neutral';
//   trendValue?: string;
// }

export default function DashboardMetrics() {
  const metrics = [
    { 
      title: "Margin Used", 
      value: "₹1,82,450", 
      subtitle: "42% of total margin", 
      icon: DollarSign,
      trend: 'up',
      trendValue: "2.3%"
    },
    { 
      title: "Margin Available", 
      value: "₹2,52,780", 
      subtitle: "58% of total margin", 
      icon: PieChart,
      trend: 'neutral'
    },
    { 
      title: "Current M2M", 
      value: "₹12,580", 
      subtitle: "Mark-to-market value", 
      icon: BarChart3,
      trend: 'up',
      trendValue: "5.7%"
    },
    { 
      title: "Realized P&L", 
      value: "₹45,620", 
      subtitle: "This month", 
      icon: Target,
      trend: 'up',
      trendValue: "12.4%"
    },
    { 
      title: "Active Strategies", 
      value: 8, 
      subtitle: "Running strategies", 
      icon: Calendar,
      trend: 'up',
      trendValue: "+2"
    },
    { 
      title: "Closed Strategies", 
      value: 12, 
      subtitle: "Completed strategies", 
      icon: CheckCircle,
      trend: 'neutral'
    },
    { 
      title: "Open Positions", 
      value: 24, 
      subtitle: "All legs included", 
      icon: Briefcase,
      trend: 'down',
      trendValue: "-3"
    },
    { 
      title: "Closed Positions", 
      value: 36, 
      subtitle: "Completed positions", 
      icon: FileText,
      trend: 'up',
      trendValue: "+8"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const trendColor = metric.trend === 'up' ? 'text-success' : 
                          metric.trend === 'down' ? 'text-error' : 'text-info';
        
        return (
          <div key={index} className="stats bg-base-100 border border-base-300 rounded-xl overflow-hidden">
            <div className="stat p-2">
              <div className="stat-figure mt-2">
                <div className="p-3 rounded-full bg-primary/5 ring-1 ring-primary/10">
                  <Icon size={24} className="text-primary" />
                </div>
              </div>
              
              <div className="stat-title text-sm font-medium text-base-content/60 uppercase tracking-wide">{metric.title}</div>
              <div className="stat-value text-2xl font-bold mt-1">{metric.value}</div>
              
              <div className="stat-desc flex items-center justify-between mt-2">
                <span className="text-xs text-base-content/70">{metric.subtitle}</span>
                {metric.trendValue && (
                  <span className={`flex items-center text-sm font-medium ${trendColor}`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown size={16} className="mr-1" />
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