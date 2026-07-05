import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Activity, 
  Sparkles, 
  Award,
  AlertCircle
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface HealthTabProps {
  report: EngineeringReport;
}

export default function HealthTab({ report }: HealthTabProps) {
  const { health } = report;

  // Formatting data for Recharts Bar chart
  const chartData = [
    { name: 'Architecture', score: health.metrics.architecture, fill: '#6366f1' }, // indigo
    { name: 'Security', score: health.metrics.security, fill: '#f43f5e' }, // rose
    { name: 'Performance', score: health.metrics.performance, fill: '#f59e0b' }, // amber
    { name: 'Maintainability', score: health.metrics.maintainability, fill: '#10b981' }, // emerald
    { name: 'Documentation', score: health.metrics.documentation, fill: '#8b5cf6' }, // violet
    { name: 'Testing Coverage', score: health.metrics.testing, fill: '#06b6d4' } // cyan
  ];

  const getMetricColor = (val: number) => {
    if (val >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (val >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6">
      
      {/* Top row - score metrics grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left overall score */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500"></div>
          <Award className="w-8 h-8 text-indigo-500 mb-2" />
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Integrated Health Index
          </h3>
          <span className="text-5xl font-extrabold text-gray-900 mb-1 font-sans tracking-tight">
            {health.overallScore}
          </span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Consolidated Grade
          </span>
        </div>

        {/* Right summary assessment card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-center space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Health Quality Review</span>
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {health.summary}
          </p>
        </div>

      </div>

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart column */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Metric Distribution Graph</span>
          </h3>
          
          <div className="w-full h-80 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Details Metrics Column */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Evaluation Breakdowns
          </h3>
          
          <div className="space-y-3">
            {chartData.map((item) => (
              <div 
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-800">{item.name}</div>
                  <div className="w-24 bg-gray-100 h-1 rounded-full overflow-hidden">
                    <div className="h-full" style={{ backgroundColor: item.fill, width: `${item.score}%` }} />
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${getMetricColor(item.score)}`}>
                  {item.score} / 100
                </div>
              </div>
            ))}
          </div>

          {health.metrics.testing < 40 && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex gap-2.5 items-start mt-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-rose-800 font-medium leading-relaxed">
                <strong>Critical Warning:</strong> Testing coverage metrics are extremely low, creating a higher risk for regressions on future code updates.
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
