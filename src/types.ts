/**
 * MergeLens TypeScript Definitions
 */

export interface RepositoryMetadata {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
  size: number; // in KB
}

export interface FolderNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FolderNode[];
}

export interface ArchitectureReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  structure: FolderNode[];
}

export interface CodeQualityIssue {
  type: 'smell' | 'duplicate' | 'complexity' | 'size' | 'naming';
  severity: 'high' | 'medium' | 'low';
  file: string;
  title: string;
  description: string;
  line?: number;
}

export interface CodeQualityReport {
  score: number;
  summary: string;
  issues: CodeQualityIssue[];
  metrics: {
    maintainabilityIndex: number;
    duplicateLinesPercent: number;
    cognitiveComplexityScore: number;
  };
}

export interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'secret' | 'unsafe_code' | 'dependency' | 'other';
  title: string;
  description: string;
  file?: string;
  recommendation: string;
}

export interface SecurityReport {
  score: number;
  summary: string;
  vulnerabilities: SecurityVulnerability[];
}

export interface PerformanceBottleneck {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file?: string;
  suggestion: string;
}

export interface PerformanceReport {
  score: number;
  summary: string;
  bottlenecks: PerformanceBottleneck[];
}

export interface DocumentationReport {
  score: number;
  readmeReview: string;
  missingDocs: string[];
  suggestions: string[];
}

export interface HealthMetric {
  name: string;
  score: number;
  color: string;
}

export interface HealthReport {
  overallScore: number;
  metrics: {
    architecture: number;
    security: number;
    performance: number;
    maintainability: number;
    documentation: number;
    testing: number;
  };
  summary: string;
}

export interface RecommendationItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  solution: string;
  category: 'architecture' | 'code_quality' | 'security' | 'performance' | 'documentation';
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface EngineeringReport {
  id: string;
  metadata: RepositoryMetadata;
  architecture: ArchitectureReport;
  codeQuality: CodeQualityReport;
  security: SecurityReport;
  performance: PerformanceReport;
  documentation: DocumentationReport;
  health: HealthReport;
  recommendations: RecommendationItem[];
  timestamp: string;
}

export interface AnalysisState {
  id: string;
  repoUrl: string;
  status: 'idle' | 'downloading' | 'indexing' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  message: string;
  report?: EngineeringReport;
  error?: string;
}
