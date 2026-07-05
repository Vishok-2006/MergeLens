import React from 'react';
import { motion } from 'motion/react';
import { 
  GitFork, 
  Star, 
  FolderGit2, 
  FileCode, 
  Activity, 
  Calendar,
  HardDrive
} from 'lucide-react';
import { EngineeringReport } from '../types';

interface OverviewTabProps {
  report: EngineeringReport;
}

export default function OverviewTab({ report }: OverviewTabProps) {
  const { metadata, health, architecture } = report;

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const scoreRingColor = (score: number) => {
    if (score >= 85) return 'border-emerald-500';
    if (score >= 70) return 'border-amber-500';
    return 'border-rose-500';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const statCards = [
    {
      icon: <Star className="w-5 h-5 text-amber-500" />,
      label: 'GitHub Stars',
      value: metadata.stars.toLocaleString(),
    },
    {
      icon: <GitFork className="w-5 h-5 text-indigo-500" />,
      label: 'Forks Count',
      value: metadata.forks.toLocaleString(),
    },
    {
      icon: <FileCode className="w-5 h-5 text-emerald-500" />,
      label: 'Language',
      value: metadata.primaryLanguage,
    },
    {
      icon: <FolderGit2 className="w-5 h-5 text-rose-500" />,
      label: 'Tech Stack',
      value: metadata.framework,
    },
    {
      icon: <HardDrive className="w-5 h-5 text-cyan-500" />,
      label: 'Repository Size',
      value: `${(metadata.size / 1024).toFixed(1)} MB`,
    },
    {
      icon: <Calendar className="w-5 h-5 text-violet-500" />,
      label: 'Last Synced',
      value: formatDate(metadata.updatedAt),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Bento layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Repository Description and AI Executive Summary */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 flex-grow">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Project Description
            </h3>
            <p className="text-base text-gray-800 leading-relaxed font-semibold">
              {metadata.description}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 flex-grow">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Executive Architect Summary
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {architecture.summary}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              {health.summary}
            </p>
          </div>
        </div>

        {/* Right column: Central Circular Health Score Widget */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">
            Overall Health Score
          </h3>

          <div className={`w-36 h-36 rounded-full border-8 ${scoreRingColor(health.overallScore)} flex flex-col items-center justify-center mb-6 shadow-sm bg-gray-50`}>
            <span className="text-4xl font-extrabold text-gray-900 font-sans tracking-tight">
              {health.overallScore}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Score / 100
            </span>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${scoreColor(health.overallScore)}`}>
            {health.overallScore >= 85 ? 'Highly Maintainable' : health.overallScore >= 70 ? 'Satisfactory Health' : 'Needs Optimization'}
          </div>
        </div>

      </div>

      {/* Numerical metadata stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {card.label}
              </span>
              <div className="p-1 bg-gray-50 rounded-lg">
                {card.icon}
              </div>
            </div>
            <div className="text-base font-extrabold text-gray-900 font-sans">
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
