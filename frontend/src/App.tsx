import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { PullRequests } from './pages/PullRequests';
import { PullRequestDetail } from './pages/PullRequestDetail';
import { Repositories } from './pages/Repositories';
import { Webhooks } from './pages/Webhooks';
import { Analytics } from './pages/Analytics';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { API_BASE } from './services/api';

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/events`);
    const invalidate = () => {
      queryClient.invalidateQueries();
      setIsRefreshing(false);
    };
    ['pr.processing','pr.embedding','pr.retrieving','pr.generating','pr.completed','pr.failed','review.completed'].forEach((event) => source.addEventListener(event, invalidate));
    return () => source.close();
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setIsRefreshing(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans antialiased">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pull-requests" element={<PullRequests />} />
              <Route path="/pull-requests/:id" element={<PullRequestDetail />} />
              <Route path="/repositories" element={<Repositories />} />
              <Route path="/webhooks" element={<Webhooks />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
