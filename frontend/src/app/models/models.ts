export interface User { id: number; username: string; role: string; }
export interface Case { id: number; name: string; description?: string; status: string; created_by: number; created_at: string; }
export interface Scan {
  id: number; case_id: number; image_path: string; image_hash?: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  config: Record<string, unknown>; total_bytes?: number; elapsed_seconds?: number;
  error_message?: string; started_at?: string; completed_at?: string; created_at: string;
}
export interface Feature { id: number; feature_type: string; offset?: number; forensic_path?: string; value: string; context?: string; }
export interface HistogramEntry { value: string; count: number; }
