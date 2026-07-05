import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompare, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { AnalysisState, EngineeringReport } from './types';

// Page components imports
import LandingPage from './components/LandingPage';
import AnalysisProgressView from './components/AnalysisProgressView';
import RepoDashboard from './components/RepoDashboard';

export default function App() {
  const [view, setView] = useState<'landing' | 'progress' | 'dashboard'>('landing');
  const [repoUrl, setRepoUrl] = useState('');
  const [analysisId, setAnalysisId] = useState('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    id: '',
    repoUrl: '',
    status: 'idle',
    progress: 0,
    message: ''
  });

  const [connectionError, setConnectionError] = useState(false);

  // Triggered when user enters repository and clicks "Analyze"
  const handleStartAnalysis = async (inputRepo: string) => {
    setConnectionError(false);
    setRepoUrl(inputRepo);
    
    setAnalysisState({
      id: 'pending',
      repoUrl: inputRepo,
      status: 'downloading',
      progress: 5,
      message: 'Contacting server to initialize analytics...'
    });
    setView('progress');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: inputRepo })
      });

      if (!response.ok) {
        throw new Error('Analysis server failed to initiate analysis.');
      }

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data?.id) {
        setAnalysisId(resJson.data.id);
        setAnalysisState(prev => ({
          ...prev,
          id: resJson.data.id,
          progress: 15,
          message: 'Workspace allocated on server. Fetching from GitHub...'
        }));
      } else {
        throw new Error(resJson.message || 'Invalid server response structure');
      }

    } catch (err: any) {
      console.error(err);
      setAnalysisState(prev => ({
        ...prev,
        status: 'failed',
        error: err?.message || 'Server connection timed out or is un-contactable.'
      }));
    }
  };

  // Background polling scheduler
  useEffect(() => {
    if (!analysisId || view !== 'progress') return;

    let intervalId: any = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}`);
        if (!response.ok) {
          throw new Error('Connection error polling background job.');
        }

        const resJson = await response.json();
        if (resJson.status === 'success' && resJson.data) {
          const updatedState = resJson.data as AnalysisState;
          setAnalysisState(updatedState);

          if (updatedState.status === 'completed' && updatedState.report) {
            clearInterval(intervalId);
            // Stalling slightly to let progress bar finish elegantly
            setTimeout(() => {
              setView('dashboard');
            }, 600);
          } else if (updatedState.status === 'failed') {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error('Polling failed', err);
        // Do not crash, keep polling occasionally unless consecutive errors
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [analysisId, view]);

  // Back to start state
  const handleReset = () => {
    setView('landing');
    setRepoUrl('');
    setAnalysisId('');
    setAnalysisState({
      id: '',
      repoUrl: '',
      status: 'idle',
      progress: 0,
      message: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Visual Navigation Bar */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div 
            onClick={handleReset} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-indigo-100">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight font-display">
                MergeLens
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block -mt-1 font-mono">
                Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              v1.0 Production
            </span>
          </div>

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow flex flex-col justify-start w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-grow flex flex-col justify-start"
          >
            {view === 'landing' && (
              <LandingPage 
                onAnalyze={handleStartAnalysis} 
                isLoading={analysisState.status !== 'idle' && analysisState.status !== 'failed'} 
              />
            )}

            {view === 'progress' && (
              <AnalysisProgressView 
                status={analysisState.status}
                progress={analysisState.progress}
                message={analysisState.message}
                repoUrl={repoUrl}
                error={analysisState.error}
                onReset={handleReset}
              />
            )}

            {view === 'dashboard' && analysisState.report && (
              <RepoDashboard 
                report={analysisState.report} 
                analysisId={analysisId}
                onBackToSearch={handleReset}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Block */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-semibold print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 MergeLens Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 transition-colors">Privacy Policy</span>
            <span className="hover:text-gray-600 transition-colors">Terms of Service</span>
            <span className="hover:text-gray-600 transition-colors">System Health: 100%</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
