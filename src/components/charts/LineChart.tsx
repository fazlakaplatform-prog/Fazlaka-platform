import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type ChartData = Record<string, string | number>;

interface LineChartComponentProps {
  data: ChartData[];
  lines: {
    dataKey: string;
    stroke: string;
    name: string;
    nameEn?: string;
    type?: 'monotone' | 'linear' | 'stepAfter';
  }[];
  xAxisDataKey: string;
  height?: number;
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lines,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  const textColor = isRTL ? '#d1d5db' : '#4b5563';
  const gridColor = isRTL ? "#374151" : "#e0e0e0";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
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
        {lines.map((line, index) => (
          <Line
            key={`${line.dataKey}-${index}`}
            type={line.type || "monotone"}
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            dot={{ fill: line.stroke, r: 4 }}
            activeDot={{ r: 6 }}
            name={language === 'ar' ? line.name : (line.nameEn || line.name)}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;