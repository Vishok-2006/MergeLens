import React from 'react';
import { 
  Zap, 
  Sparkles, 
  Gauge, 
  HelpCircle,
  Timer
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface PerformanceTabProps {
  report: EngineeringReport;
}

export default function PerformanceTab({ report }: PerformanceTabProps) {
  const { performance } = report;

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low': return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Performance score card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center gap-6 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500"></div>
          
          <div className="bg-amber-50 text-amber-500 p-4 rounded-full">
            <Gauge className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Performance Grade
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{performance.score}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ 100 Efficiency</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Evaluates execution latencies, thread-blocking operations, synchronous I/O, and asset loading layouts.
            </p>
          </div>
        </div>

        {/* Sync Bottlenecks Count */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <Timer className="w-6 h-6 text-amber-500 mb-2" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Active Bottlenecks
          </h3>
          <span className="text-3xl font-extrabold text-amber-600">
            {performance.bottlenecks.length}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            Blocking Nodes Detected
          </span>
        </div>

      </div>

      {/* Performance Summary review card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Performance Assessment</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          {performance.summary}
        </p>
      </div>

      {/* Bottlenecks List container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Identified Execution Bottlenecks ({performance.bottlenecks.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {performance.bottlenecks.map((bottleneck, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(bottleneck.severity)}`}>
                      {bottleneck.severity} Severity
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{bottleneck.title}</h4>
                </div>

                {bottleneck.file && (
                  <div className="text-xs font-semibold text-amber-700 font-mono bg-amber-50/30 border border-amber-100 px-2 py-1 rounded-md max-w-64 truncate">
                    {bottleneck.file}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {bottleneck.description}
              </p>

              {/* Optimization advice */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Refactoring Action Plan</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {bottleneck.suggestion}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
