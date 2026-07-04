import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitPullRequest,
  Database,
  Activity,
  BarChart3,
  Brain,
  Settings,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pull Requests', path: '/pull-requests', icon: GitPullRequest },
    { name: 'Repositories', path: '/repositories', icon: Database },
    { name: 'Webhook Activity', path: '/webhooks', icon: Activity },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: Brain },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Admin Console', path: '/admin', icon: Shield },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:flex`}
      >
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <span className="font-sans font-bold tracking-tight text-white text-lg">
              Merge<span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Lens</span>
            </span>
            <span className="ml-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400">
              v1.0
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'text-indigo-400'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950/40">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-900/50 p-3 border border-zinc-800/60">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-zinc-300">System Status</p>
              <p className="text-[10px] text-zinc-500 truncate">Connected to localhost:8080</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
