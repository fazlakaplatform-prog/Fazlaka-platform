import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// نوع بيانات الرسم البياني
type ChartData = Record<string, string | number>;

interface AreaChartComponentProps {
  data: ChartData[];
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

// تعريف واجهة مخصصة للـ Payload الخاص بـ Recharts
interface CustomPayload {
  value: number | string;
  name: string;
  color?: string;
  payload?: ChartData;
}

const AreaChartComponent: React.FC<AreaChartComponentProps> = ({
  data,
  area,
  xAxisDataKey,
  height = 300,
  language = 'ar',
  isRTL = false
}) => {
  
  /**
   * تم الإصلاح هنا:
   * بدلاً من TooltipProps التي تسبب مشاكل، نستخدم تعريفاً يدوياً للخصائص
   * التي يمررها Recharts داخلياً لمكون الـ Tooltip.
   */
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: CustomPayload[]; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="label font-bold text-gray-900 dark:text-white">{label}</p>
          <p className="intro text-sm" style={{ color: area.stroke }}>
            {language === 'ar' ? area.name : (area.nameEn || area.name)}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id={`color${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={area.fill} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={area.fill} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isRTL ? "#374151" : "#e0e0e0"} />
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fill: isRTL ? '#d1d5db' : '#4b5563', fontSize: 12 }}
          axisLine={{ stroke: isRTL ? '#4b5563' : '#d1d5db' }}
        />
        <YAxis 
          tick={{ fill: isRTL ? '#d1d5db' : '#4b5563', fontSize: 12 }}
          axisLine={{ stroke: isRTL ? '#4b5563' : '#d1d5db' }}
        />
        {/* نمرر المكون مباشرة، Recharts سيتكفل بالباقي */}
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={area.dataKey}
          stroke={area.stroke}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#color${area.dataKey})`}
          name={language === 'ar' ? area.name : (area.nameEn || area.name)}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartComponent;