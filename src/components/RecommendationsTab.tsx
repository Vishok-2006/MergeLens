import React, { useState } from 'react';
import { 
  Lightbulb, 
  ArrowUpCircle, 
  ArrowRightCircle, 
  ArrowDownCircle,
  TrendingUp,
  Code2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EngineeringReport, RecommendationItem } from '../types';

interface RecommendationsTabProps {
  report: EngineeringReport;
}

export default function RecommendationsTab({ report }: RecommendationsTabProps) {
  const { recommendations } = report;
  const [expandedId, setExpandedId] = useState<string | null>(recommendations[0]?.id || null);

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <ArrowUpCircle className="w-5 h-5 text-rose-500 fill-rose-50" />;
      case 'medium': return <ArrowRightCircle className="w-5 h-5 text-amber-500 fill-amber-50" />;
      case 'low': return <ArrowDownCircle className="w-5 h-5 text-cyan-500 fill-cyan-50" />;
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500"></div>
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">Prioritized Action Items</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium mt-0.5">
            Step-by-step technical upgrades formulated by MergeLens. Start with High Priority items to resolve critical bottlenecks first.
          </p>
        </div>
      </div>

      {/* Recommendations Cards Listing */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isExpanded = expandedId === rec.id;
          
          return (
            <div 
              key={rec.id}
              className={`bg-white rounded-xl border transition-all ${
                isExpanded 
                  ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' 
                  : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow'
              }`}
            >
              
              {/* Header block */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  {getPriorityIcon(rec.priority)}
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getPriorityBadge(rec.priority)}`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                        {rec.category.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{rec.title}</h4>
                  </div>
                </div>

                <div className="p-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Collapsible Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4 text-xs font-medium">
                  
                  {/* Description */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Identified Limitation</div>
                    <p className="text-gray-600 leading-relaxed">{rec.description}</p>
                  </div>

                  {/* Impact and Solution Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    
                    {/* Impact */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-1.5 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Business & Architecture Impact</span>
                      </span>
                      <p className="text-gray-600 leading-relaxed flex-grow">{rec.impact}</p>
                    </div>

                    {/* Solution */}
                    <div className="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50 space-y-1.5 flex flex-col">
                      <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Actionable Technical Solution</span>
                      </span>
                      <p className="text-gray-600 leading-relaxed flex-grow">{rec.solution}</p>
                    </div>

                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
