import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// تم تعريف نوع أكثر أمانًا لبيانات الرسم البياني
type ChartData = Record<string, string | number>;

interface LineChartProps {
  data: ChartData[]; // <-- تم التصحيح هنا
  lines: {
    dataKey: string;
    stroke: string;
    name: string;
    nameEn?: string;
  }[];
  xAxisDataKey: string;
  height?: number;
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fill: isRTL ? '#fff' : '#000' }}
        />
        <YAxis tick={{ fill: isRTL ? '#fff' : '#000' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isRTL ? '#1f2937' : '#fff',
            borderColor: isRTL ? '#374151' : '#e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            name={language === 'ar' ? line.name : (line.nameEn || line.name)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;