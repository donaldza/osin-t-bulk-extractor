import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Case, Scan, Feature, HistogramEntry } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Cases
  getCases() { return this.http.get<Case[]>(`${this.base}/cases`); }
  createCase(name: string, description?: string) { return this.http.post<Case>(`${this.base}/cases`, { name, description }); }
  getCase(id: number) { return this.http.get<Case>(`${this.base}/cases/${id}`); }

  // Scans
  getScans(caseId: number) { return this.http.get<Scan[]>(`${this.base}/cases/${caseId}/scans`); }
  createScan(caseId: number, image_path: string, config = {}) {
    return this.http.post<Scan>(`${this.base}/cases/${caseId}/scans`, { image_path, config });
  }
  getScan(id: number) { return this.http.get<Scan>(`${this.base}/scans/${id}`); }
  getScanSummary(id: number) { return this.http.get<Record<string, number>>(`${this.base}/scans/${id}/summary`); }
  getFeatures(id: number, params: Record<string, unknown>) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<Feature[]>(`${this.base}/scans/${id}/features`, { params: p });
  }
  getHistograms(id: number, type: string) {
    return this.http.get<HistogramEntry[]>(`${this.base}/scans/${id}/histograms`, { params: { type } });
  }
  getAlerts(id: number) { return this.http.get<Feature[]>(`${this.base}/scans/${id}/alerts`); }
}
