import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface DocumentationTabProps {
  report: EngineeringReport;
}

export default function DocumentationTab({ report }: DocumentationTabProps) {
  const { documentation } = report;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left: Documentation score & README Critique */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Documentation Score banner */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-violet-500"></div>
          
          <div className="bg-violet-50 text-violet-600 p-4 rounded-full">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Documentation Quality
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{documentation.score}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ 100 Completeness</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Evaluates README structures, installation guidelines, dependency documentation, and inline commenting standards.
            </p>
          </div>
        </div>

        {/* README review block */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <FileText className="w-4 h-4 text-violet-500" />
            <span>Interactive README Audit</span>
          </h3>
          
          <div className="prose prose-sm text-xs text-gray-600 leading-relaxed space-y-3 font-medium">
            <p className="whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono text-[11px] leading-relaxed">
              {documentation.readmeReview}
            </p>
          </div>
        </div>

      </div>

      {/* Right: Missing Documentation list & Suggestions */}
      <div className="space-y-6">
        
        {/* Flagged Missing Documentation card */}
        <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 w-fit px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Missing Documentation Assets</span>
          </h3>

          <ul className="space-y-3">
            {documentation.missingDocs.map((doc, idx) => (
              <li key={idx} className="flex gap-2 items-start text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-rose-500 font-bold mt-0.5">•</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Documentation suggestions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-violet-500" />
            <span>Suggestions for Improvement</span>
          </h3>

          <ul className="space-y-3">
            {documentation.suggestions.map((sug, idx) => (
              <li key={idx} className="flex gap-2 items-start text-xs text-gray-600 font-medium">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}
