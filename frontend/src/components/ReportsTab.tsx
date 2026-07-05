import React from 'react';
import { 
  Printer, 
  Download, 
  FileCheck, 
  Award, 
  Activity, 
  ShieldAlert, 
  Gauge, 
  BookOpen, 
  Sparkles,
  GitBranch
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface ReportsTabProps {
  report: EngineeringReport;
}

export default function ReportsTab({ report }: ReportsTabProps) {
  const { metadata, architecture, codeQuality, security, performance, documentation, health, recommendations } = report;

  const triggerPrint = () => {
    window.print();
  };

  const triggerDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `MergeLens-${metadata.owner}-${metadata.name}-Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      
      {/* Controls Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Export System Reports</h3>
          <p className="text-xs text-gray-500 font-medium">Download the raw structured database analysis or compile a clean printer-friendly PDF dossier.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={triggerPrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF Document</span>
          </button>
          
          <button
            onClick={triggerDownloadJson}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer border border-gray-200 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Raw JSON</span>
          </button>
        </div>
      </div>

      {/* Structured Document Body for printing */}
      <div id="printable-report" className="bg-white rounded-2xl border border-gray-150 p-8 md:p-12 shadow-md space-y-10 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 print:hidden"></div>
        
        {/* Title Block */}
        <div className="border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">MergeLens Repository Dossier</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {metadata.owner} / {metadata.name}
            </h2>
            <p className="text-xs text-gray-500 font-semibold font-mono">
              Scanned on: {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-indigo-600">{health.overallScore}</div>
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Health Grade</div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              {metadata.framework}
            </div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>1. Executive Architecture Summary</span>
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {architecture.summary}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {health.summary}
          </p>
        </section>

        {/* 2. Architecture & Directory layout */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <GitBranch className="w-4 h-4 text-indigo-500" />
            <span>2. Folder & Module Strengths</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-xl space-y-2">
              <div className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Architectural Strengths</div>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {architecture.strengths.map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>
            <div className="bg-rose-50/20 border border-rose-100/50 p-4 rounded-xl space-y-2">
              <div className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">Structural Risks</div>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {architecture.weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Code Quality Review */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>3. Code Quality & Smells Review (Score: {codeQuality.score}/100)</span>
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {codeQuality.summary}
          </p>
          <div className="space-y-2">
            {codeQuality.issues.slice(0, 3).map((issue, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-gray-800">[{issue.severity.toUpperCase()}] {issue.title}</span>
                  <span className="text-gray-500"> - {issue.description}</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {issue.file}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Security Risks */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>4. Security Risk Assessment (Score: {security.score}/100)</span>
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {security.summary}
          </p>
          <div className="space-y-2">
            {security.vulnerabilities.slice(0, 3).map((vuln, i) => (
              <div key={i} className="p-3 bg-rose-50/30 rounded-lg border border-rose-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-rose-800">[{vuln.severity.toUpperCase()}] {vuln.title}</span>
                  <span className="text-gray-500"> - {vuln.description}</span>
                </div>
                {vuln.file && (
                  <span className="text-[10px] font-mono text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    {vuln.file}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Performance Diagnostics */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            <span>5. Performance Diagnostics (Score: {performance.score}/100)</span>
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {performance.summary}
          </p>
        </section>

        {/* 6. Documentation Checklist */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <BookOpen className="w-4 h-4 text-violet-500" />
            <span>6. Documentation Review (Score: {documentation.score}/100)</span>
          </h3>
          <p className="text-xs text-gray-500 font-mono leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 text-[11px]">
            {documentation.readmeReview}
          </p>
        </section>

        {/* 7. Strategic Recommendations */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>7. Actionable Recommendations</span>
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={rec.id} className="p-4 border border-gray-100 rounded-xl space-y-1 bg-gray-50/50 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{i + 1}. {rec.title}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{rec.description}</p>
                <div className="text-[10px] text-indigo-600 font-semibold pt-1">
                  <em>Action Plan:</em> {rec.solution}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  );
}
