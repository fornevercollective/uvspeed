// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Type definitions for history-search-engine.js v2.0

export interface SearchResult {
  title: string;
  source: string;
  url?: string;
  snippet?: string;
  author?: string;
  year?: number;
  id?: string;
  _fetchedDoc?: FetchedDocument;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  latencyMs: number;
  connectorsUsed: number;
  totalResults: number;
}

export interface SearchOptions {
  onProgress?: (progress: SearchProgress) => void;
}

export interface SearchProgress {
  results: SearchResult[];
  completed: number;
  total: number;
  connector: string;
  error?: string;
  latestBatch: SearchResult[];
}

export interface ConnectorInfo {
  name: string;
  icon: string;
  enabled: boolean;
}

export interface TimelineScale {
  name: string;
  min: number;
  max: number;
  color: string;
}

export interface FetchedDocument {
  title: string;
  content: string;
  source: string;
  url: string;
  wordCount: number;
  language: string;
  fetchedAt: number;
  categories?: string[];
  authors?: string[];
  subjects?: string[];
  creator?: string;
  date?: string;
  snippet?: string;
  _analysis?: ContextAnalysisResult;
}

export interface ToneScores {
  academic: number;
  marketing: number;
  educational: number;
  narrative: number;
  legal: number;
  crisis: number;
  dominant: string;
}

export interface VocabularyProfile {
  totalWords: number;
  uniqueWords: number;
  typeTokenRatio: number;
  hapaxRatio: number;
  avgWordLength: number;
  top50: Array<{ word: string; count: number }>;
}

export interface ContextAnalysisResult {
  tone: ToneScores;
  vocabulary: VocabularyProfile;
  subReferences: Record<string, string[]>;
  monetarySignals: string[];
  sentiment: number;
  readabilityScore: number;
  heartbeat: number;
  aiPerspective: string;
}

export interface PatternCluster {
  title: string;
  source: string;
  heartbeat: number;
}

export interface Shockwave {
  title: string;
  source: string;
  crisisScore: number;
  monetaryTerms: number;
  sentiment: number;
}

export interface PatternResult {
  clusters: Record<string, PatternCluster[]>;
  economicDensity: number;
  attentionRatio: number;
  heartbeatRatio: number;
  shockwaves: Shockwave[];
  documentsAnalyzed: number;
  prediction: string;
}

export interface HistorySearchAPI {
  readonly VERSION: string;

  /** Search across all enabled connectors. */
  search(query: string, opts?: SearchOptions): Promise<SearchResponse>;

  /** Get list of all connectors with current enabled state. */
  getConnectors(): ConnectorInfo[];

  /** Enable/disable a connector by name or index. */
  setConnectorEnabled(nameOrIndex: string | number, enabled: boolean): void;

  /** Get timeline scale definitions. */
  getScales(): TimelineScale[];

  /** Get color for a source name. */
  getSourceColor(source: string): string;

  /** Render mini timeline on a canvas element. */
  drawTimeline(canvas: HTMLCanvasElement): void;

  /** Fetch and extract document content from a URL. */
  fetchDocument(url: string, source?: string): Promise<FetchedDocument>;

  /** Analyze document context: tone, vocabulary, references, monetary signals. */
  analyzeContext(doc: FetchedDocument | { content: string } | string): ContextAnalysisResult;

  /** Detect cross-result patterns, economic density, shockwaves. */
  detectPatterns(results: SearchResult[], documents?: FetchedDocument[]): PatternResult;

  readonly SRC_COLORS: Record<string, string>;
  readonly CONNECTORS: unknown[];
  readonly TL_SCALES: TimelineScale[];
}

declare global {
  interface Window {
    HistorySearch: HistorySearchAPI;
  }
}

export default HistorySearchAPI;
