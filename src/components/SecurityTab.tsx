import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  AlertTriangle,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface SecurityTabProps {
  report: EngineeringReport;
}

export default function SecurityTab({ report }: SecurityTabProps) {
  const { security } = report;
  const [filter, setFilter] = useState<'all' | 'critical' | 'secret' | 'dependency'>('all');

  const getSeverityBadge = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-800 border-rose-200 ring-2 ring-rose-50';
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low': return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'secret': return 'Credential Leak';
      case 'unsafe_code': return 'Unsafe Logic';
      case 'dependency': return 'Dependency Risk';
      default: return 'Code Risk';
    }
  };

  const filteredVulns = security.vulnerabilities.filter(vuln => {
    if (filter === 'critical') return vuln.severity === 'critical' || vuln.severity === 'high';
    if (filter === 'secret') return vuln.category === 'secret';
    if (filter === 'dependency') return vuln.category === 'dependency';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Metrics bento card header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Security score card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center gap-6 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-rose-500"></div>
          
          <div className="bg-rose-50 text-rose-600 p-4 rounded-full">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Security Evaluation
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{security.score}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ 100 Quality Score</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Vulnerability scans scan for hardcoded secrets, third-party library updates, and insecure configurations.
            </p>
          </div>
        </div>

        {/* Total risks flagged */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <FolderLock className="w-6 h-6 text-rose-500 mb-2" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Threats Detected
          </h3>
          <span className="text-3xl font-extrabold text-rose-600">
            {security.vulnerabilities.length}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            Unresolved Incidents
          </span>
        </div>

      </div>

      {/* Security summary paragraph */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Security Audit Summary</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          {security.summary}
        </p>
      </div>

      {/* Vulnerabilities Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Filtering segment */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-gray-500" />
            <span>Risk Vulnerability List ({filteredVulns.length})</span>
          </h3>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Risks' },
              { id: 'critical', label: 'High & Critical' },
              { id: 'secret', label: 'Secrets Leak' },
              { id: 'dependency', label: 'Dependencies' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                  filter === btn.id 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vulnerabilities loop */}
        <div className="divide-y divide-gray-100">
          {filteredVulns.length > 0 ? (
            filteredVulns.map((vuln, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors space-y-4">
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(vuln.severity)}`}>
                        {vuln.severity} Risk
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-100 bg-gray-50 text-gray-500 uppercase tracking-wider">
                        {getCategoryBadge(vuln.category)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{vuln.title}</h4>
                  </div>

                  {vuln.file && (
                    <div className="text-xs font-semibold text-rose-700 font-mono bg-rose-50/30 border border-rose-100 px-2 py-1 rounded-md max-w-64 truncate">
                      {vuln.file}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {vuln.description}
                </p>

                {/* Mitigations / Recommendation block */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-emerald-500" />
                    <span>Mitigation Action Plan</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {vuln.recommendation}
                  </p>
                </div>

              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 italic text-xs">
              No security risks identified matching selected filters.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
