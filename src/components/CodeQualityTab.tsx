import React, { useState } from 'react';
import { 
  FileCode, 
  Activity, 
  AlertCircle, 
  Sparkles,
  Award,
  Filter
} from 'lucide-react';
import { EngineeringReport, CodeQualityIssue } from '../types';

interface CodeQualityTabProps {
  report: EngineeringReport;
}

export default function CodeQualityTab({ report }: CodeQualityTabProps) {
  const { codeQuality } = report;
  const [filter, setFilter] = useState<'all' | 'high' | 'smell' | 'complexity'>('all');

  const getSeverityStyles = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low': return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getIssueBadge = (type: CodeQualityIssue['type']) => {
    switch (type) {
      case 'smell': return 'Code Smell';
      case 'duplicate': return 'Duplicated Code';
      case 'complexity': return 'Complexity Hotspot';
      case 'size': return 'Monolithic File';
      case 'naming': return 'Naming Issue';
    }
  };

  const getIssueColor = (type: CodeQualityIssue['type']) => {
    switch (type) {
      case 'smell': return 'text-violet-700 bg-violet-50 border-violet-100';
      case 'duplicate': return 'text-orange-700 bg-orange-50 border-orange-100';
      case 'complexity': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'size': return 'text-blue-700 bg-blue-50 border-blue-100';
      case 'naming': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    }
  };

  const filteredIssues = codeQuality.issues.filter(issue => {
    if (filter === 'high') return issue.severity === 'high';
    if (filter === 'smell') return issue.type === 'smell';
    if (filter === 'complexity') return issue.type === 'complexity' || issue.type === 'size';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Upper Metrics Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Score Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <Award className="w-8 h-8 text-emerald-500 mb-2" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Code Quality Score
          </h3>
          <span className="text-4xl font-extrabold text-gray-900 mb-1">
            {codeQuality.score}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Maintainable Code
          </span>
        </div>

        {/* Maintainability Index card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Maintainability Index
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 mb-2">
              {codeQuality.metrics.maintainabilityIndex}%
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full" 
                style={{ width: `${codeQuality.metrics.maintainabilityIndex}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cognitive Complexity card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Cognitive Complexity
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 mb-2">
              {codeQuality.metrics.cognitiveComplexityScore}
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Average branch logic density count per module files. Lower is better.
            </p>
          </div>
        </div>

        {/* Duplication rate card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Duplicated Lines
            </span>
            <FileCode className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 mb-2">
              {codeQuality.metrics.duplicateLinesPercent}%
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Estimated percentage of redundant duplicate statement sequences.
            </p>
          </div>
        </div>

      </div>

      {/* Code Summary review */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Automated Quality Review</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          {codeQuality.summary}
        </p>
      </div>

      {/* Issues Listing Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Filtering header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-500" />
            <span>Identified Code Quality Issues ({filteredIssues.length})</span>
          </h3>
          
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Issues' },
              { id: 'high', label: 'High Priority' },
              { id: 'smell', label: 'Code Smells' },
              { id: 'complexity', label: 'Complexity/Bloat' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                  filter === btn.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Issues list */}
        <div className="divide-y divide-gray-100">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getIssueColor(issue.type)}`}>
                      {getIssueBadge(issue.type)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityStyles(issue.severity)}`}>
                      {issue.severity} priority
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-gray-900">{issue.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{issue.description}</p>
                </div>

                <div className="shrink-0 text-right md:min-w-44 space-y-1">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Resource</div>
                  <div className="text-xs font-semibold text-indigo-600 font-mono bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded-md inline-block max-w-64 truncate">
                    {issue.file}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 italic text-xs">
              No code quality issues detected matching selected filters.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
