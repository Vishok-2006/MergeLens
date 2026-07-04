import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Bot, CheckCircle2, GitPullRequest, Shield, Sparkles, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { endpoints } from '../services/api';

const metricIcons = [CheckCircle2, GitPullRequest, Bot, Shield, Zap, AlertTriangle, Activity, Sparkles];

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: endpoints.dashboard, refetchInterval: 30000 });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: endpoints.analytics, refetchInterval: 30000 });
  const stats = data?.stats || {};
  const cards = [
    ['Repositories', stats.repositories], ['Open PRs', stats.openPrs], ['AI Reviews', stats.aiReviews], ['Avg Review Score', stats.averageReviewScore],
    ['Security Issues', stats.securityIssues], ['Code Smells', stats.codeSmells], ['Pending Reviews', stats.pendingReviews], ['Merged PRs', stats.mergedPrs],
  ];

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl border border-indigo-500/20 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.28),transparent_35%),linear-gradient(135deg,#09090b,#18181b)] p-8 shadow-2xl shadow-indigo-950/20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-3 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">Live AI Pull Request Intelligence</p><h1 className="text-4xl font-black tracking-tight text-white">MergeLens Command Center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Real webhook ingestion, Qdrant retrieval, NVIDIA analysis, review scoring, and realtime operational visibility.</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>Realtime stream connected</div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value], i) => { const Icon = metricIcons[i]; return <motion.div key={label as string} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.03}} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-semibold uppercase tracking-wider">{label}</span><Icon size={18}/></div><div className="mt-4 text-3xl font-black text-white">{isLoading ? '...' : value ?? 0}</div></motion.div> })}</section>

    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 lg:col-span-2"><div className="mb-4"><h2 className="font-bold text-white">PRs per day</h2><p className="text-xs text-zinc-500">Backend-derived repository activity</p></div><div className="h-72"><ResponsiveContainer><AreaChart data={analytics?.prsPerDay || []}><XAxis dataKey="day" stroke="#71717a" fontSize={11}/><YAxis stroke="#71717a" fontSize={11}/><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:12}}/><Area dataKey="prs" stroke="#818cf8" fill="#6366f133" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold text-white">Live Processing Queue</h2><div className="mt-4 space-y-3">{(data?.processingQueue || []).length === 0 && <p className="text-sm text-zinc-500">No pending processing jobs.</p>}{(data?.processingQueue || []).map((pr:any)=><div key={pr.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><p className="truncate text-sm font-medium text-white">#{pr.number} {pr.title}</p><p className="mt-1 text-xs text-indigo-300">{pr.status}</p></div>)}</div></div>
    </section>

    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold text-white">Recent AI Activity</h2><div className="mt-4 divide-y divide-zinc-800">{(data?.recentActivity || []).map((pr:any)=><div key={pr.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium text-white">{pr.repository?.fullName} #{pr.number}</p><p className="text-xs text-zinc-500">{pr.title}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{pr.status}</span></div>)}</div></section>
  </div>;
}
