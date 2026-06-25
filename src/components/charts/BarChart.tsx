import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type ChartData = Record<string, string | number>;

interface BarChartComponentProps {
  data: ChartData[];
  bar: {
    dataKey: string;
    fill: string;
    name: string;
    nameEn?: string;
    radius?: number;
  };
  xAxisDataKey: string;
  height?: number;
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  bar,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  const textColor = isRTL ? '#d1d5db' : '#4b5563';
  const gridColor = isRTL ? "#374151" : "#e0e0e0";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
        />
        <YAxis 
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isRTL ? '#1f2937' : '#fff',
            borderColor: isRTL ? '#374151' : '#e5e7eb',
            borderRadius: '8px',
            color: isRTL ? '#fff' : '#000'
          }}
        />
        <Legend 
          formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
        />
        <Bar 
          dataKey={bar.dataKey} 
          fill={bar.fill} 
          name={language === 'ar' ? bar.name : (bar.nameEn || bar.name)}
          radius={bar.radius || [4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;