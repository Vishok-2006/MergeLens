import React, { useEffect, useState } from 'react';
import { Menu, Bell, RefreshCw, ChevronDown, Github, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';

interface HeaderProps {
  onMenuClick: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

interface Repository {
  id: number;
  fullName: string;
  htmlUrl: string;
}

export function Header({ onMenuClick, onRefresh, isRefreshing = false }: HeaderProps) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('All Repositories');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/api/repositories`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRepositories(res.data);
        }
      })
      .catch((err) => console.error('Failed to load repositories', err));
  }, [API]);

  const notifications = [
    { id: 1, text: 'New PR #12 analyzed in MergeLens', time: '5m ago', unread: true },
    { id: 2, text: 'AI Suggestion: Security fix in auth.ts', time: '1h ago', unread: true },
    { id: 3, text: 'Webhook verified for MergeLens/MergeLens', time: '2h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-6 backdrop-blur-md">
      {/* Left side: Mobile Menu Toggle & Repo Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Repository Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-900 hover:text-zinc-100 focus:outline-none"
          >
            <Github size={15} className="text-zinc-400" />
            <span className="max-w-[160px] truncate">{selectedRepo}</span>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {showRepoDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRepoDropdown(false)} />
              <div className="absolute left-0 mt-2 z-20 w-64 origin-top-left rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl">
                <button
                  onClick={() => {
                    setSelectedRepo('All Repositories');
                    setShowRepoDropdown(false);
                  }}
                  className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  All Repositories
                </button>
                <div className="my-1 border-t border-zinc-800" />
                {repositories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 italic">No repositories integrated yet.</div>
                ) : (
                  repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepo(repo.fullName);
                        setShowRepoDropdown(false);
                      }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white truncate"
                    >
                      {repo.fullName}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side: Global Actions */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 z-20 w-80 origin-top-right rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                  <button className="text-[10px] text-indigo-400 hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-zinc-800/50 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${n.unread ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>
                          {n.text}
                        </p>
                        {n.unread && <span className="h-1.5 w-1.5 mt-1 rounded-full bg-indigo-500 flex-shrink-0"></span>}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-5 w-[1px] bg-zinc-800" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-1.5 focus:outline-none"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-700 bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="flex h-full w-full items-center justify-center font-semibold text-white text-xs">
                DE
              </div>
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {showProfileDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
              <div className="absolute right-0 mt-2 z-20 w-48 origin-top-right rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-200">Devil Developer</p>
                  <p className="text-[10px] text-zinc-500 truncate">admin@mergelens.local</p>
                </div>
                <div className="p-1">
                  <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white">
                    <User size={13} /> My Profile
                  </button>
                  <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white">
                    <SettingsIcon size={13} /> Account Settings
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
