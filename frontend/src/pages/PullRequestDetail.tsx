import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Bot, FileCode, MessageSquare, Shield, Sparkles, Zap } from 'lucide-react';
import { endpoints } from '../services/api';

const tabs = ['Overview','Changed Files','Diff Viewer','AI Review','Security','Performance','Best Practices','Refactoring','History','Comments'];

export function PullRequestDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [message, setMessage] = useState('Explain the highest risk in this pull request.');
  const [chat, setChat] = useState<any[]>([]);
  const { data, isLoading } = useQuery({ queryKey: ['pull-request', id], queryFn: () => endpoints.pullRequest(id), enabled: !!id, refetchInterval: 30000 });
  const { data: diff } = useQuery({ queryKey: ['diff', id], queryFn: () => endpoints.diff(id), enabled: !!id && tab === 'Diff Viewer' });
  const review = useMutation({ mutationFn: () => endpoints.review(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pull-request', id] }) });
  const chatMutation = useMutation({ mutationFn: endpoints.chat, onSuccess: (res) => setChat(c => [...c, { role:'assistant', content: res.answer }]) });

  if (isLoading) return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center text-zinc-400">Loading pull request analysis...</div>;
  const pr = data?.pr; const scores = data?.scores || {}; const comments = data?.comments || []; const files = (pr?.filesChanged || '').split(',').filter(Boolean);
  if (!pr) return <div className="text-zinc-400">Pull request not found.</div>;
  const scoreCards = [['Risk Score', 100 - (scores.qualityScore || 0), Shield], ['Quality Score', scores.qualityScore || 0, Sparkles], ['Security Score', scores.securityScore || 0, Shield], ['Performance Score', Math.max(0, 100 - (scores.complexityScore || 0)), Zap]];

  const send = () => { if (!message.trim()) return; setChat(c => [...c, {role:'user', content:message}]); chatMutation.mutate(message); setMessage(''); };

  return <div className="space-y-6"><div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><button onClick={()=>navigate('/pull-requests')} className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3"><ArrowLeft size={16}/></button><div><p className="text-xs text-zinc-500">{pr.repository?.fullName} · #{pr.number}</p><h1 className="mt-1 text-2xl font-black text-white">{pr.title}</h1><p className="mt-2 text-sm text-zinc-500">{pr.author} · {pr.status}</p></div></div><button onClick={()=>review.mutate()} disabled={review.isPending} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-400 disabled:opacity-50"><Bot className="mr-2 inline" size={16}/>{review.isPending?'Generating...':'Run AI Review'}</button></div>
  <div className="grid gap-4 md:grid-cols-4">{scoreCards.map(([label,value,Icon]:any)=><div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="flex items-center justify-between text-zinc-400"><span className="text-xs uppercase tracking-wider">{label}</span><Icon size={16}/></div><p className="mt-3 text-3xl font-black text-white">{value}</p></div>)}</div>
  <div className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm ${tab===t?'bg-indigo-500 text-white':'text-zinc-400 hover:bg-zinc-800'}`}>{t}</button>)}</div>
  {tab === 'Overview' && <section className="grid gap-6 lg:grid-cols-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 lg:col-span-2"><h2 className="font-bold text-white">Summary</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{pr.summary || 'No pull request description supplied by GitHub.'}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold text-white">Changed Files</h2><div className="mt-3 space-y-2">{files.map((f:string)=><p key={f} className="truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-300"><FileCode className="mr-2 inline" size={14}/>{f}</p>)}</div></div></section>}
  {tab === 'Changed Files' && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">{files.map((f:string)=><div key={f} className="border-b border-zinc-800 py-3 text-sm text-zinc-300">{f}</div>)}</div>}
  {tab === 'Diff Viewer' && <div className="overflow-hidden rounded-2xl border border-zinc-800"><Editor height="620px" theme="vs-dark" defaultLanguage="diff" value={diff?.diff || ''} options={{readOnly:true,minimap:{enabled:false},fontSize:13}}/></div>}
  {['AI Review','Security','Performance','Best Practices','Refactoring','Comments'].includes(tab) && <div className="grid gap-6 lg:grid-cols-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 lg:col-span-2"><h2 className="font-bold text-white">{tab}</h2><div className="mt-4 space-y-3">{comments.map((c:any)=><div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase text-indigo-300">{c.severity}</span><span className="text-xs text-zinc-500">{c.filePath}:{c.lineNumber}</span></div><p className="text-sm leading-6 text-zinc-300">{c.message}</p></div>)}{comments.length===0 && <p className="text-sm text-zinc-500">No saved AI findings yet. Run AI Review after webhook ingestion or from this page.</p>}</div></div><aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><h3 className="mb-3 font-bold text-white"><MessageSquare className="mr-2 inline" size={16}/>AI Chat</h3><div className="mb-3 h-64 space-y-3 overflow-auto rounded-xl bg-zinc-950 p-3">{chat.map((m,i)=><p key={i} className={`text-sm ${m.role==='user'?'text-indigo-200':'text-zinc-300'}`}>{m.content}</p>)}</div><textarea value={message} onChange={e=>setMessage(e.target.value)} className="h-24 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-white outline-none"/><button onClick={send} className="mt-2 w-full rounded-xl bg-indigo-500 py-2 text-sm font-bold text-white">Ask with RAG</button></aside></div>}
  {tab === 'History' && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Created {new Date(pr.createdAt).toLocaleString()} · Updated {new Date(pr.updatedAt).toLocaleString()}</div>}
  </div>;
}
