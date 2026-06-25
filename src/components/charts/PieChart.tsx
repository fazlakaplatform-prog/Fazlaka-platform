import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieLabelRenderProps
} from 'recharts';

// تم استبدال [key: string]: any بأنواع محددة لتجنب خطأ ESLint
// مع الحفاظ على توافق الواجهة مع متطلبات recharts
interface PieDataItem {
  name: string;
  nameEn?: string;
  value: number;
  color?: string;
  [key: string]: string | number | boolean | undefined;
}

interface PieChartComponentProps {
  data: PieDataItem[];
  height?: number;
  colors?: string[];
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  height = 300,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  language = 'ar',
  isRTL = false
}) => {
  const textColor = isRTL ? '#d1d5db' : '#4b5563';

  const renderLabel = (props: PieLabelRenderProps) => {
    const { index, percent } = props;
    if (index === undefined || data[index] === undefined || percent === undefined) return '';
    
    const item = data[index];
    const name = language === 'ar' ? item.name : (item.nameEn || item.name);
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  const renderLegend = (value: string) => {
    const item = data.find(d => (language === 'ar' ? d.name : (d.nameEn || d.name)) === value);
    const displayName = item ? (language === 'ar' ? item.name : (item.nameEn || item.name)) : value;
    
    return <span style={{ color: textColor, marginLeft: isRTL ? '10px' : '0' }}>{displayName}</span>;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isRTL ? '#1f2937' : '#fff',
            borderColor: isRTL ? '#374151' : '#e5e7eb',
            borderRadius: '8px',
            color: isRTL ? '#fff' : '#000'
          }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend formatter={renderLegend} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;