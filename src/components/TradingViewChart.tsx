'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  AreaSeriesPartialOptions,
  LineSeriesPartialOptions,
  Time,
  // v5+ series type identifiers:
  AreaSeries,
  LineSeries,
} from 'lightweight-charts';

interface ChartDataItem {
  time: Time;
  value: number;
}

interface TradingViewChartProps {
  data: ChartDataItem[];
  timeframe: string;
  type?: 'basic' | 'advanced';
}

const TradingViewChart = ({ data, timeframe, type = 'basic' }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<'Area'> | ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#2B2B43' },
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add series using v5+ addSeries API
    if (type === 'basic') {
      const areaSeriesOptions: AreaSeriesPartialOptions = {
        topColor: 'rgba(33, 150, 243, 0.4)',
        bottomColor: 'rgba(33, 150, 243, 0.05)',
        lineColor: 'rgba(33, 150, 243, 1)',
        lineWidth: 2,
      };
      // Note: use AreaSeries constant
      series.current = chart.current.addSeries(AreaSeries, areaSeriesOptions) as ISeriesApi<'Area'>;
    } else {
      const lineSeriesOptions: LineSeriesPartialOptions = {
        color: '#2196F3',
        lineWidth: 2,
      };
      // Note: use LineSeries constant
      series.current = chart.current.addSeries(LineSeries, lineSeriesOptions) as ISeriesApi<'Line'>;
    }

    if (series.current) {
      series.current.setData(data);
    }

    const handleResize = () => {
      if (chartContainerRef.current && chart.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [data, type]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default TradingViewChart;