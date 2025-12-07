import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// تم تعريف نوع أكثر أمانًا لبيانات الرسم البياني
type ChartData = Record<string, string | number>;

interface AreaChartProps {
  data: ChartData[]; // <-- تم التصحيح هنا
  area: {
    dataKey: string;
    stroke: string;
    fill: string;
    name: string;
    nameEn?: string;
  };
  xAxisDataKey: string;
  height?: number;
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({
  data,
  area,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
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
        <Area
          type="monotone"
          dataKey={area.dataKey}
          stroke={area.stroke}
          fill={area.fill}
          name={language === 'ar' ? area.name : (area.nameEn || area.name)}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartComponent;