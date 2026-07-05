import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  GitBranch, 
  ShieldCheck, 
  Zap, 
  FileCode, 
  BookOpen, 
  ArrowRight,
  Activity
} from 'lucide-react';

interface LandingPageProps {
  onAnalyze: (repoUrl: string) => void;
  isLoading: boolean;
}

export default function LandingPage({ onAnalyze, isLoading }: LandingPageProps) {
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = repoInput.trim();
    if (!cleanInput) {
      setError('Please provide a repository name or URL.');
      return;
    }

    // Basic check: if it doesn't contain a slash and isn't a URL, it's invalid
    if (!cleanInput.includes('/') && !cleanInput.includes('github.com')) {
      setError('Invalid format. Must be "owner/repo" or a complete github.com link.');
      return;
    }

    setError('');
    onAnalyze(cleanInput);
  };

  const handleQuickStart = (repo: string) => {
    setRepoInput(repo);
    setError('');
    onAnalyze(repo);
  };

  const sampleRepos = [
    { name: 'facebook/react', label: 'React Core' },
    { name: 'fastapi/fastapi', label: 'FastAPI Python' },
    { name: 'microsoft/vscode', label: 'VS Code' },
    { name: 'spring-projects/spring-boot', label: 'Spring Boot' }
  ];

  const features = [
    {
      icon: <GitBranch className="w-6 h-6 text-indigo-500" />,
      title: "Interactive Architecture Review",
      description: "Extracts complete folder structures and file trees to outline core module strengths, weaknesses, and structural bottlenecks."
    },
    {
      icon: <FileCode className="w-6 h-6 text-emerald-500" />,
      title: "Automated Code Quality Scans",
      description: "Identifies complex cognitive hotspots, code smells, duplicate operations, naming conventions, and maintains metrics logs."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-500" />,
      title: "Security Risk Guard",
      description: "Audits dependency structures, flags hardcoded credentials, locates permissive access controls, and logs safety warnings."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Performance Optimization",
      description: "Traces synchronous I/O blocks, uncacheable queries, and suggests targeted code optimizations for maximum performance."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-rose-500" />,
      title: "Documentation Analysis",
      description: "Reviews readme completeness, gauges onboarding readiness, and drafts detailed missing documentation components."
    },
    {
      icon: <Activity className="w-6 h-6 text-violet-500" />,
      title: "Repository-Aware AI Chat",
      description: "Fully interactive assistant loaded with your source repository insights. Code fixes, tests generation, and live queries."
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
      
      {/* Brand Header & Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Repository Intelligence</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4 bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-900 bg-clip-text text-transparent">
          MergeLens
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium">
          Analyze any public GitHub repository instantly. Retrieve a complete engineering audit outlining architecture, security, quality, and interactive AI consultation.
        </p>
      </motion.div>

      {/* Repository Search input card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-2xl bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 mb-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>
        
        <form onSubmit={validateAndSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            GitHub Repository Path or Link
          </label>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. facebook/react or https://github.com/fastapi/fastapi"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-900 font-medium placeholder-gray-400 transition-all text-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="md:w-36 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-rose-600"
            >
              {error}
            </motion.p>
          )}
        </form>

        {/* Quickstart suggestions */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Quick Analysis Samples
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleRepos.map((repo) => (
              <button
                key={repo.name}
                type="button"
                onClick={() => handleQuickStart(repo.name)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-lg text-xs font-medium border border-gray-100 hover:border-indigo-100 transition-all cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500" />
                <span>{repo.label}</span>
                <span className="text-gray-300">({repo.name})</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feature Section header */}
      <div className="w-full text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Comprehensive Analysis Spectrum
        </h2>
        <p className="text-sm md:text-base text-gray-500 mt-2 max-w-xl mx-auto">
          MergeLens executes standard directory inspections and feeds compiled metadata to advanced models for holistic technical reviews.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
        {features.map((feat, idx) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
          >
            <div className="p-2.5 bg-gray-50 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              {feat.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {feat.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed flex-grow">
              {feat.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
