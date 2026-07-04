import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Github,
  RefreshCw,
  Server,
  SlidersHorizontal,
  Wifi,
  Zap,
} from 'lucide-react';
import { endpoints } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderHealth {
  name: string;
  configured: boolean;
  healthy: boolean;
  state: string; // 'CONNECTED' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'TIMEOUT' | 'UNAVAILABLE' | 'ERROR' | 'NOT_CONFIGURED'
  message: string;
  latency: number | null;
  model: string;
  embeddingModel?: string;
}

interface StatusData {
  github: boolean;
  mysql: boolean;
  qdrant: boolean;
  qdrantUrl: string;
  nvidia: ProviderHealth;
  groq: ProviderHealth;
  currentProvider: string;
  fallbackProvider: string;
  fallbackEnabled: boolean;
}

interface AiStatusData {
  currentProvider: string;
  fallbackProvider: string;
  fallbackEnabled: boolean;
  totalRequests: number;
  fallbackCount: number;
  averageLatencyMs: number;
  lastSuccessfulProvider: string;
  providers: ProviderHealth[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ state, message }: { state: string; message: string }) {
  let bgColor = 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20';
  let dotColor = 'bg-zinc-400';
  let label = 'Unknown';

  switch (state) {
    case 'CONNECTED':
      bgColor = 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20';
      dotColor = 'bg-emerald-400';
      label = 'Connected';
      break;
    case 'RATE_LIMITED':
      bgColor = 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20';
      dotColor = 'bg-amber-400';
      label = 'Rate Limited';
      break;
    case 'TIMEOUT':
      bgColor = 'bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/20';
      dotColor = 'bg-orange-400';
      label = 'Timeout';
      break;
    case 'UNAUTHORIZED':
      bgColor = 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20';
      dotColor = 'bg-rose-400';
      label = 'Unauthorized';
      break;
    case 'UNAVAILABLE':
      bgColor = 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20';
      dotColor = 'bg-rose-400';
      label = 'Unavailable';
      break;
    case 'ERROR':
      bgColor = 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20';
      dotColor = 'bg-rose-400';
      label = 'Error';
      break;
    case 'NOT_CONFIGURED':
      bgColor = 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20';
      dotColor = 'bg-zinc-400';
      label = 'Not Configured';
      break;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bgColor}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        {label}
      </span>
      {message && message !== 'Connected' && (
        <span className="text-[10px] text-zinc-400 max-w-[200px] text-right truncate" title={message}>
          {message}
        </span>
      )}
    </div>
  );
}

function InfraStatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
          : 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {label ?? (ok ? 'Connected' : 'Not Configured')}
    </span>
  );
}

function InfraCard({
  icon: Icon,
  name,
  ok,
  detail,
}: {
  icon: React.ElementType;
  name: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          <Icon size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          {detail && <p className="text-xs text-zinc-500">{detail}</p>}
        </div>
      </div>
      <InfraStatusBadge ok={ok} />
    </div>
  );
}

function AIProviderCard({
  name,
  role,
  configured,
  healthy,
  state,
  message,
  model,
  embeddingModel,
  latency,
  isActive,
  isFallbackActivated,
}: {
  name: string;
  role: 'primary' | 'fallback';
  configured: boolean;
  healthy: boolean;
  state: string;
  message: string;
  model: string;
  embeddingModel?: string;
  latency?: number | null;
  isActive: boolean;
  isFallbackActivated?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 transition ${
        isActive
          ? 'border-indigo-500/40 bg-indigo-500/5 ring-1 ring-indigo-500/20'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      {/* Role pill */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            role === 'primary'
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          {role === 'primary' ? 'Primary' : 'Fallback'}
        </span>
        {isFallbackActivated && (
          <span className="animate-pulse rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            Fallback Active
          </span>
        )}
      </div>

      {/* Provider name & health badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              configured && healthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{name}</h3>
          </div>
        </div>
        <StatusBadge state={state} message={message} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-2">
        <InfoRow label="Chat Model" value={model || 'Not configured'} />
        {embeddingModel !== undefined && (
          <InfoRow label="Embedding Model" value={embeddingModel || 'Not configured'} />
        )}
        <InfoRow label="Latency" value={latency !== undefined && latency !== null ? `${latency} ms` : 'N/A'} />
        <InfoRow label="Health" value={healthy ? 'Healthy' : configured ? 'Unhealthy' : 'N/A'} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200 truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon size={13} className="text-zinc-500" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Settings() {
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<StatusData>({
    queryKey: ['status'],
    queryFn: endpoints.status,
    refetchInterval: 30_000,
  });

  const { data: aiStatus, isLoading: aiLoading } = useQuery<AiStatusData>({
    queryKey: ['aiStatus'],
    queryFn: endpoints.aiStatus,
    refetchInterval: 30_000,
  });

  const isLoading = statusLoading || aiLoading;

  const nvidiaActive = status?.currentProvider === 'NVIDIA';
  const groqActive   = status?.currentProvider === 'Groq';
  const fallbackActivated = aiStatus ? aiStatus.fallbackCount > 0 && groqActive : false;

  const aiNvidia = aiStatus?.providers?.find(p => p.name === 'NVIDIA');
  const aiGroq   = aiStatus?.providers?.find(p => p.name === 'Groq');

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-300">Settings</p>
          <h1 className="text-3xl font-black text-white">AI Pipeline Configuration</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Live runtime status for all integrations. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <button
          onClick={() => refetchStatus()}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Infrastructure Cards ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Infrastructure
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfraCard icon={Github}   name="GitHub" ok={!!status?.github} detail="Webhook & API" />
          <InfraCard icon={Database} name="MySQL"  ok={!!status?.mysql}  detail="Primary database" />
          <InfraCard icon={Server}   name="Qdrant" ok={!!status?.qdrant} detail={status?.qdrantUrl} />
        </div>
      </section>

      {/* ── Current AI Summary Banner ── */}
      {status && (
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Activity size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-500">Active AI Provider</p>
            <p className="text-lg font-bold text-white">
              {status.currentProvider !== 'none' ? status.currentProvider : 'No provider available'}
            </p>
          </div>
          {status.fallbackEnabled && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Fallback</p>
              <p className="text-sm font-medium text-amber-400">{status.fallbackProvider}</p>
            </div>
          )}
          {fallbackActivated && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              <AlertTriangle size={11} />
              Fallback Active
            </div>
          )}
        </div>
      )}

      {/* ── AI Provider Cards ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          AI Providers
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <AIProviderCard
            name="NVIDIA NIM"
            role="primary"
            configured={!!status?.nvidia?.configured}
            healthy={!!status?.nvidia?.healthy}
            state={status?.nvidia?.state ?? 'NOT_CONFIGURED'}
            message={status?.nvidia?.message ?? ''}
            model={status?.nvidia?.model ?? ''}
            embeddingModel={status?.nvidia?.embeddingModel}
            latency={status?.nvidia?.latency}
            isActive={nvidiaActive}
          />
          <AIProviderCard
            name="Groq"
            role="fallback"
            configured={!!status?.groq?.configured}
            healthy={!!status?.groq?.healthy}
            state={status?.groq?.state ?? 'NOT_CONFIGURED'}
            message={status?.groq?.message ?? ''}
            model={status?.groq?.model ?? ''}
            latency={status?.groq?.latency}
            isActive={groqActive}
            isFallbackActivated={fallbackActivated}
          />
        </div>
      </section>

      {/* ── AI Metrics ── */}
      {aiStatus && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            AI Metrics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <MetricTile label="Total Requests"   value={aiStatus.totalRequests}   icon={Zap} />
            <MetricTile label="Fallback Count"   value={aiStatus.fallbackCount}   icon={AlertTriangle} />
            <MetricTile label="Avg Latency"      value={`${aiStatus.averageLatencyMs}ms`} icon={Activity} />
            <MetricTile label="Last Provider"    value={aiStatus.lastSuccessfulProvider} icon={Wifi} />
          </div>
        </section>
      )}

      {/* ── RAG Controls ── */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
          <SlidersHorizontal size={16} />
          RAG Configuration
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Embedding Model"     value={status?.nvidia?.embeddingModel ?? aiNvidia?.embeddingModel} />
          <Field label="Chat Model"          value={status?.nvidia?.model ?? aiNvidia?.model} />
          <Field label="Qdrant URL"          value={status?.qdrantUrl} />
          <Field label="Top K Results"       value="Backend: TOP_K_RESULTS" />
          <Field label="Similarity Threshold" value="Backend: SIMILARITY_THRESHOLD" />
          <Field label="Max Chunk Size"      value="Backend: MAX_CHUNK_SIZE" />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{value || 'Not configured'}</p>
    </div>
  );
}
