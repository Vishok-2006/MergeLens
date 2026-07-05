import React from 'react';
import { motion } from 'motion/react';
import { 
  GitPullRequest, 
  Layers, 
  Cpu, 
  FileCheck, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';

interface AnalysisProgressProps {
  status: 'idle' | 'downloading' | 'indexing' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  message: string;
  repoUrl: string;
  error?: string;
  onReset: () => void;
}

export default function AnalysisProgressView({ 
  status, 
  progress, 
  message, 
  repoUrl, 
  error, 
  onReset 
}: AnalysisProgressProps) {
  
  // Define steps
  const steps = [
    {
      id: 'downloading',
      label: 'Repository Download',
      desc: 'Retrieving repository size, files list, and readme content.',
      icon: <GitPullRequest className="w-5 h-5" />,
      threshold: 25,
    },
    {
      id: 'indexing',
      label: 'Code Indexing',
      desc: 'Indexing workspace directory nodes and language frameworks.',
      icon: <Layers className="w-5 h-5" />,
      threshold: 50,
    },
    {
      id: 'analyzing',
      label: 'Security & Quality Analysis',
      desc: 'Evaluating system bottlenecks, unsafe calls, and smells.',
      icon: <Cpu className="w-5 h-5" />,
      threshold: 75,
    },
    {
      id: 'completed',
      label: 'Report Generation',
      desc: 'Compiling structured executive summaries and suggestions.',
      icon: <FileCheck className="w-5 h-5" />,
      threshold: 100,
    }
  ];

  const getStepStatus = (stepThreshold: number, stepId: string) => {
    if (status === 'failed') return 'failed';
    if (progress >= stepThreshold) return 'completed';
    // Current active step check
    if (
      (stepId === 'downloading' && status === 'downloading') ||
      (stepId === 'indexing' && status === 'indexing') ||
      (stepId === 'analyzing' && status === 'analyzing') ||
      (stepId === 'completed' && status === 'completed')
    ) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-16 flex flex-col items-center">
      
      {/* Loading header */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
          {status === 'failed' ? 'Analysis Failed' : 'Analyzing Repository'}
        </h2>
        <p className="text-xs text-indigo-600 font-semibold mt-1 font-mono uppercase tracking-wide">
          {repoUrl}
        </p>
      </div>

      {status === 'failed' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white rounded-xl border border-rose-100 p-6 shadow-md text-center space-y-4"
        >
          <div className="mx-auto bg-rose-50 text-rose-600 p-3.5 rounded-full w-fit">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Workspace Interrupted</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono">
            {error || 'An unexpected error occurred during repository analysis.'}
          </p>
          <button
            onClick={onReset}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg text-xs cursor-pointer transition-colors"
          >
            Return to Search
          </button>
        </motion.div>
      ) : (
        <div className="w-full space-y-8">
          
          {/* Progress bar card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-500 flex items-center gap-1.5 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                {message}
              </span>
              <span className="text-indigo-600 font-mono font-bold text-sm">
                {progress}%
              </span>
            </div>
            
            {/* Animated bar track */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Timeline steps stack */}
          <div className="relative pl-6 space-y-6">
            
            {/* vertical connector line */}
            <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-gray-100"></div>
            
            {steps.map((step, idx) => {
              const stepStatus = getStepStatus(step.threshold, step.id);
              
              let badgeColor = "bg-gray-50 border-gray-100 text-gray-400";
              let titleColor = "text-gray-400";
              let descColor = "text-gray-400";

              if (stepStatus === 'completed') {
                badgeColor = "bg-emerald-50 border-emerald-100 text-emerald-600";
                titleColor = "text-gray-900 font-bold";
                descColor = "text-gray-500";
              } else if (stepStatus === 'active') {
                badgeColor = "bg-indigo-50 border-indigo-200 text-indigo-600 ring-4 ring-indigo-50";
                titleColor = "text-indigo-950 font-bold";
                descColor = "text-gray-700";
              }

              return (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="relative flex gap-4 items-start"
                >
                  {/* Status Indicator circle */}
                  <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border shadow-sm transition-all ${badgeColor}`}>
                    {stepStatus === 'active' ? (
                      <div className="relative">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow pt-0.5 space-y-0.5">
                    <h3 className={`text-sm ${titleColor}`}>
                      {step.label}
                    </h3>
                    <p className={`text-xs leading-relaxed ${descColor}`}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
