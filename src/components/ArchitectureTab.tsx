import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Layers 
} from 'lucide-react';
import { EngineeringReport, FolderNode } from '../types';

interface ArchitectureTabProps {
  report: EngineeringReport;
}

// Recursive Folder/File Item
function FileTreeNode({ node, depth = 0 }: { node: FolderNode; depth?: number; key?: string }) {
  const [isOpen, setIsOpen] = useState(depth === 0 || depth === 1); // Open root by default
  const isFolder = node.type === 'folder';

  return (
    <div className="select-none font-mono text-xs">
      <div 
        onClick={() => isFolder && setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
          isFolder ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 10}px` }}
      >
        {isFolder ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <Folder className="w-4 h-4 text-indigo-400 fill-indigo-50" />
            <span className="font-semibold">{node.name}/</span>
          </>
        ) : (
          <>
            <span className="w-3.5" /> {/* spacing to align with folders */}
            <FileCode className="w-4 h-4 text-gray-400" />
            <span>{node.name}</span>
          </>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div className="border-l border-gray-100 ml-4 pl-0.5">
          {node.children.map((child, idx) => (
            <FileTreeNode key={`${child.path}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArchitectureTab({ report }: ArchitectureTabProps) {
  const { architecture } = report;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left: Interactive Directory file tree explorer */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col h-[520px]">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Interactive Folder Tree</span>
        </h3>
        
        <div className="flex-grow overflow-y-auto pr-2 border border-gray-50 rounded-lg p-3 bg-gray-50/50">
          {architecture.structure && architecture.structure.length > 0 ? (
            architecture.structure.map((node, idx) => (
              <FileTreeNode key={`${node.path}-${idx}`} node={node} depth={0} />
            ))
          ) : (
            <p className="text-xs text-gray-400 italic text-center pt-8">No indexed files detected.</p>
          )}
        </div>
        
        <div className="text-[10px] text-gray-400 mt-3 font-mono">
          * Shows top mapped repository file nodes (ignoring build artifacts).
        </div>
      </div>

      {/* Right: Strengths, Weaknesses and suggestions list */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Architecture Executive report Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Architecture Strategy Summary
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {architecture.summary}
          </p>
        </div>

        {/* Bento grid containing Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Strengths card */}
          <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 w-fit px-2.5 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Architectural Strengths</span>
            </h4>
            
            <ul className="space-y-2.5">
              {architecture.strengths.map((str, idx) => (
                <li key={idx} className="flex gap-2 items-start text-xs text-gray-600 font-medium">
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses card */}
          <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 w-fit px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Structural Risks</span>
            </h4>
            
            <ul className="space-y-2.5">
              {architecture.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex gap-2 items-start text-xs text-gray-600 font-medium">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Improvement suggestions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Refactoring Suggestions</span>
          </h4>
          
          <ul className="space-y-3">
            {architecture.suggestions.map((sug, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="bg-indigo-50 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}
