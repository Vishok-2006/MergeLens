import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GitBranch, GitPullRequest, Search, SlidersHorizontal } from 'lucide-react';
import { endpoints } from '../services/api';

export function PullRequests() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const { data: prs = [], isLoading } = useQuery({ queryKey: ['pull-requests'], queryFn: () => endpoints.pullRequests(), refetchInterval: 30000 });
  const filtered = useMemo(() => prs.filter((pr:any) => {
    const hay = `${pr.title} ${pr.author} ${pr.repository?.fullName} ${pr.state} ${pr.status}`.toLowerCase();
    return hay.includes(query.toLowerCase()) && (status === 'all' || pr.status === status || pr.state === status);
  }), [prs, query, status]);

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm text-indigo-300">Pull Requests</p><h1 className="text-3xl font-black text-white">Review Inbox</h1><p className="mt-2 text-sm text-zinc-500">Search, filter, sort, and open AI-backed analysis details.</p></div><div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">{filtered.length} results</div></div>
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-2.5 text-zinc-500" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search repository, title, branch, author..." className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"/></label><select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"><option value="all">All statuses</option><option value="open">Open</option><option value="closed">Closed</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option></select><button className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300"><SlidersHorizontal size={16}/> Advanced</button></div></div>
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"><table className="w-full text-left text-sm"><thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">PR</th><th className="px-4 py-3">Repository</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">State</th><th className="px-4 py-3">AI Status</th><th className="px-4 py-3">Updated</th></tr></thead><tbody className="divide-y divide-zinc-800">{isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Loading pull requests...</td></tr>}{filtered.map((pr:any)=><tr key={pr.id} className="hover:bg-zinc-800/40"><td className="px-4 py-4"><Link to={`/pull-requests/${pr.id}`} className="font-semibold text-white hover:text-indigo-300"><GitPullRequest className="mr-2 inline" size={16}/>#{pr.number} {pr.title}</Link></td><td className="px-4 py-4 text-zinc-300"><GitBranch className="mr-2 inline" size={14}/>{pr.repository?.fullName}</td><td className="px-4 py-4 text-zinc-400">{pr.author}</td><td className="px-4 py-4"><span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">{pr.state}</span></td><td className="px-4 py-4 text-indigo-300">{pr.status}</td><td className="px-4 py-4 text-zinc-500">{new Date(pr.updatedAt).toLocaleString()}</td></tr>)}</tbody></table></div>
  </div>;
}
