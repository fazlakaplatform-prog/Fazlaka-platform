import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  PieLabelRenderProps
} from 'recharts';

// تم تعريف نوع لبيانات الرسم البياني الدائري
interface PieDataItem {
  name: string;
  nameEn?: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface PieChartProps {
  data: PieDataItem[];
  height?: number;
  colors?: string[];
  language?: 'ar' | 'en';
  isRTL?: boolean;
}

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  height = 300,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  language = 'ar',
  isRTL = false
}) => {
  // دالة مخصصة للتعامل مع العناصر ثنائية اللغة
  const renderLabel = (props: PieLabelRenderProps) => {
    const { index, percent } = props;
    // التحقق من وجود العنصر في البيانات قبل الوصول إليه
    if (index === undefined || data[index] === undefined) {
      return '';
    }
    
    const item = data[index];
    const name = language === 'ar' ? item.name : (item.nameEn || item.name);
    return `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isRTL ? '#1f2937' : '#fff',
            borderColor: isRTL ? '#374151' : '#e5e7eb',
            borderRadius: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;