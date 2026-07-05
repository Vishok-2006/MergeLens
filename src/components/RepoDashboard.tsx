import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, 
  Activity, 
  ShieldAlert, 
  Gauge, 
  BookOpen, 
  Award, 
  Sparkles,
  MessageSquare,
  FileCheck,
  LayoutDashboard,
  ArrowLeft,
  Star,
  GitFork,
  Cpu
} from 'lucide-react';
import { EngineeringReport } from '../types';

// Tab imports
import OverviewTab from './OverviewTab';
import ArchitectureTab from './ArchitectureTab';
import CodeQualityTab from './CodeQualityTab';
import SecurityTab from './SecurityTab';
import PerformanceTab from './PerformanceTab';
import DocumentationTab from './DocumentationTab';
import HealthTab from './HealthTab';
import RecommendationsTab from './RecommendationsTab';
import ChatTab from './ChatTab';
import ReportsTab from './ReportsTab';

interface RepoDashboardProps {
  report: EngineeringReport;
  onBackToSearch: () => void;
  analysisId: string;
}

export default function RepoDashboard({ report, onBackToSearch, analysisId }: RepoDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'quality' | 'security' | 'performance' | 'docs' | 'health' | 'recommendations' | 'chat' | 'reports'>('overview');
  const { metadata, health } = report;

  // Tabs layout map
  const navigationItems = [
    { id: 'overview' as const, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'architecture' as const, label: 'Architecture', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'quality' as const, label: 'Code Quality', icon: <Cpu className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security Scan', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'performance' as const, label: 'Performance', icon: <Gauge className="w-4 h-4" /> },
    { id: 'docs' as const, label: 'Documentation', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'health' as const, label: 'Overall Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'recommendations' as const, label: 'Action Items', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'chat' as const, label: 'AI Chat Advisor', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'reports' as const, label: 'Dossier Reports', icon: <FileCheck className="w-4 h-4" /> }
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab report={report} />;
      case 'architecture':
        return <ArchitectureTab report={report} />;
      case 'quality':
        return <CodeQualityTab report={report} />;
      case 'security':
        return <SecurityTab report={report} />;
      case 'performance':
        return <PerformanceTab report={report} />;
      case 'docs':
        return <DocumentationTab report={report} />;
      case 'health':
        return <HealthTab report={report} />;
      case 'recommendations':
        return <RecommendationsTab report={report} />;
      case 'chat':
        return <ChatTab report={report} analysisId={analysisId} />;
      case 'reports':
        return <ReportsTab report={report} />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-8 relative">
      
      {/* 1. Left Repo Meta Card */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-5 print:hidden">
        
        {/* Back control */}
        <button
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors w-fit pb-1 border-b border-transparent hover:border-indigo-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Repository</span>
        </button>

        {/* Identity block */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Scanned Target</div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight truncate">
              {metadata.name}
            </h2>
            <p className="text-xs text-gray-500 truncate">by {metadata.owner}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100/50">
              {metadata.primaryLanguage}
            </span>
            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-100">
              {metadata.framework}
            </span>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Mini health indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">Health Score</span>
            <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${getScoreColor(health.overallScore)}`}>
              {health.overallScore}/100
            </span>
          </div>
        </div>

        {/* Sidebar Nav menu */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all text-left ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 2. Main Content tab visualizer */}
      <div className="flex-grow min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {renderActiveTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
