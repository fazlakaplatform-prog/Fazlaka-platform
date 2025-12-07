import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// تم تعريف نوع أكثر أمانًا لبيانات الرسم البياني
type ChartData = Record<string, string | number>;

interface BarChartProps {
  data: ChartData[]; // <-- تم التصحيح هنا
  bar: {
    dataKey: string;
    fill: string;
    name: string;
    nameEn?: string;
  };
  xAxisDataKey: string;
  height?: number;
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  bar,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
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
        <Bar 
          dataKey={bar.dataKey} 
          fill={bar.fill} 
          name={language === 'ar' ? bar.name : (bar.nameEn || bar.name)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;