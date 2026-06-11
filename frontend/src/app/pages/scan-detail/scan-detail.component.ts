import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Scan, Feature, HistogramEntry } from '../../models/models';
import { environment } from '../../../environments/environment';

type Tab = 'summary' | 'features' | 'histograms' | 'alerts';

@Component({
  selector: 'app-scan-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    @if (scan()) {
      <a [routerLink]="['/cases', scan()!.case_id]" class="back-link">&#8592; Case</a>
    }
    <div class="scan-header">
      <div>
        <h1 class="page-title">{{ scan()?.image_path?.split('/')?.pop() ?? '…' }}</h1>
        <p class="image-path">{{ scan()?.image_path }}</p>
      </div>
      @if (scan()) {
        <span class="badge {{ scan()!.status }}">{{ scan()!.status }}</span>
      }
    </div>

    @if (scan()?.status === 'running') {
      <div class="progress-card">
        <div class="progress-labels">
          <span>Scanning…</span>
          <span>{{ progressElapsed() }}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" [style.width]="progressPct() + '%'"></div></div>
        <span class="progress-pct">{{ progressPct().toFixed(1) }}%</span>
      </div>
    }

    @if (scan()?.status === 'failed') {
      <div class="error-card">{{ scan()!.error_message ?? 'Scan failed.' }}</div>
    }

    @if (scan()?.status === 'complete') {
      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Total bytes</div><div class="meta-val">{{ scan()!.total_bytes ? (scan()!.total_bytes! / 1e6).toFixed(0) + ' MB' : '—' }}</div></div>
        <div class="meta-card"><div class="meta-label">Duration</div><div class="meta-val">{{ scan()!.elapsed_seconds ? scan()!.elapsed_seconds!.toFixed(1) + 's' : '—' }}</div></div>
        <div class="meta-card"><div class="meta-label">Feature types</div><div class="meta-val">{{ featureTypes().length }}</div></div>
        <div class="meta-card"><div class="meta-label">Total features</div><div class="meta-val">{{ totalFeatures().toLocaleString() }}</div></div>
      </div>

      <div class="tabs">
        @for (t of tabList; track t) {
          <button class="tab-btn" [class.active]="activeTab() === t" (click)="setTab(t)">{{ t }}</button>
        }
      </div>

      @if (activeTab() === 'summary') {
        <div class="card">
          <div class="card-head">Features by type</div>
          <div class="summary-bars">
            @for (entry of summaryEntries(); track entry.key) {
              <div class="bar-row">
                <span class="bar-label">{{ entry.key }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width]="entry.pct + '%'" [style.background]="featureColor(entry.key)"></div></div>
                <span class="bar-count">{{ entry.val.toLocaleString() }}</span>
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'features') {
        <div class="card">
          <div class="features-filter">
            <select class="input" style="width:160px" [(ngModel)]="selectedType" (change)="loadFeatures()">
              <option value="">All types</option>
              @for (t of featureTypes(); track t) { <option [value]="t">{{ t }}</option> }
            </select>
            <input class="input" style="flex:1; min-width:160px" [(ngModel)]="searchVal" (input)="onSearch()" placeholder="Search values…" />
          </div>
          <table class="be-table">
            <thead><tr><th>Type</th><th>Offset</th><th>Value</th><th>Context</th></tr></thead>
            <tbody>
              @for (f of features(); track f.id) {
                <tr>
                  <td [style.color]="featureColor(f.feature_type)">{{ f.feature_type }}</td>
                  <td>{{ f.offset?.toLocaleString() ?? '—' }}</td>
                  <td style="color:#c9d1d9; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ f.value }}</td>
                  <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ f.context ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div class="pagination">
            <button class="btn btn-ghost" (click)="prevPage()" [disabled]="page() === 0">&#8592; Prev</button>
            <span class="text-muted">Page {{ page() + 1 }}</span>
            <button class="btn btn-ghost" (click)="nextPage()" [disabled]="features().length < limit">Next &#8594;</button>
          </div>
        </div>
      }

      @if (activeTab() === 'histograms') {
        <div class="card">
          <div class="features-filter">
            <select class="input" style="width:160px" [(ngModel)]="histType" (change)="loadHistograms()">
              @for (t of featureTypes(); track t) { <option [value]="t">{{ t }}</option> }
            </select>
          </div>
          <div class="hist-bars">
            @for (h of histograms().slice(0,20); track h.value) {
              <div class="hist-row">
                <span class="hist-label">{{ h.value }}</span>
                <div class="hist-track"><div class="hist-fill" [style.width]="histPct(h.count) + '%'" [style.background]="featureColor(histType)"></div></div>
                <span class="hist-count">{{ h.count.toLocaleString() }}</span>
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'alerts') {
        <div class="card">
          @if (alerts().length === 0) {
            <p class="empty">No alerts for this scan.</p>
          } @else {
            <table class="be-table">
              <thead><tr><th>Offset</th><th>Value</th><th>Context</th></tr></thead>
              <tbody>
                @for (a of alerts(); track a.id) {
                  <tr>
                    <td>{{ a.offset?.toLocaleString() ?? '—' }}</td>
                    <td style="color:#f87171">{{ a.value }}</td>
                    <td>{{ a.context ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    }
  `,
  styles: [`
    .back-link { font-size: 12px; color: #4b5c70; display: inline-block; margin-bottom: 6px; &:hover { color: #c9d1d9; } }
    .scan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .page-title { font-size: 15px; font-weight: 500; color: #c9d1d9; }
    .image-path { font-size: 10px; color: #3d4f62; margin-top: 3px; }
    .progress-card { background: #0a1a2e; border: 0.5px solid #1e3a5f; border-radius: 9px; padding: 14px 16px; margin-bottom: 18px; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: #60a5fa; margin-bottom: 8px; }
    .progress-track { height: 6px; background: #141d2a; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: #3b82f6; border-radius: 3px; transition: width .5s; }
    .progress-pct { font-size: 11px; color: #60a5fa; margin-top: 4px; display: block; }
    .error-card { background: #1f0a0a; border: 0.5px solid #7f1d1d; border-radius: 9px; padding: 12px 16px; color: #f87171; font-size: 12px; margin-bottom: 18px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px; }
    .meta-card { background: #0d1117; border: 0.5px solid #1e2d42; border-radius: 8px; padding: 12px 14px; }
    .meta-label { font-size: 10px; color: #4b5c70; text-transform: uppercase; margin-bottom: 6px; }
    .meta-val { font-size: 18px; font-weight: 500; color: #22d3ee; }
    .tabs { display: flex; border-bottom: 0.5px solid #1e2d42; margin-bottom: 16px; }
    .tab-btn { padding: 8px 16px; font-size: 12px; font-family: inherit; border: none; border-bottom: 2px solid transparent; background: none; color: #4b5c70; cursor: pointer; &.active { color: #22d3ee; border-bottom-color: #22d3ee; } &:hover { color: #c9d1d9; } }
    .summary-bars { padding: 14px 16px; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .bar-label { width: 72px; font-size: 11px; color: #6b7c8f; text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: #141d2a; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width .3s; }
    .bar-count { width: 60px; font-size: 11px; color: #6b7c8f; }
    .features-filter { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 0.5px solid #141d2a; flex-wrap: wrap; }
    .pagination { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-top: 0.5px solid #141d2a; font-size: 12px; }
    .hist-bars { padding: 14px 16px; }
    .hist-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .hist-label { width: 160px; font-size: 11px; color: #8a9baf; text-align: right; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hist-track { flex: 1; height: 10px; background: #141d2a; border-radius: 3px; overflow: hidden; }
    .hist-fill { height: 100%; border-radius: 3px; }
    .hist-count { width: 60px; font-size: 11px; color: #6b7c8f; }
    .empty { padding: 16px; color: #6b7c8f; font-size: 12px; }
  `]
})
export class ScanDetailComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private pollSub?: Subscription;
  private ws?: WebSocket;

  scanId = 0;
  scan = signal<Scan | null>(null);
  summary = signal<Record<string, number>>({});
  features = signal<Feature[]>([]);
  histograms = signal<HistogramEntry[]>([]);
  alerts = signal<Feature[]>([]);

  activeTab = signal<Tab>('summary');
  selectedType = '';
  searchVal = '';
  histType = '';
  page = signal(0);
  limit = 100;
  progressPct = signal(0);
  progressElapsed = signal('');

  tabList: Tab[] = ['summary', 'features', 'histograms', 'alerts'];

  featureTypes = computed(() => Object.keys(this.summary()));
  totalFeatures = computed(() => Object.values(this.summary()).reduce((a, b) => a + b, 0));

  summaryEntries = computed(() => {
    const s = this.summary();
    const max = Math.max(...Object.values(s), 1);
    return Object.entries(s)
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => ({ key, val, pct: (val / max) * 100 }));
  });

  featureColor(t: string): string {
    const map: Record<string, string> = { email: '#22d3ee', url: '#818cf8', ip: '#34d399', ccn: '#fb923c', telephone: '#facc15', domain: '#a78bfa', gps: '#4ade80', ether: '#f472b6' };
    return map[t] ?? '#6b7280';
  }

  histPct(count: number): number {
    const max = Math.max(...this.histograms().map(h => h.count), 1);
    return (count / max) * 100;
  }

  ngOnInit() {
    this.scanId = Number(this.route.snapshot.paramMap.get('scanId'));
    this.pollSub = interval(3000).pipe(
      switchMap(() => this.api.getScan(this.scanId)),
      takeWhile(s => s.status !== 'complete' && s.status !== 'failed', true)
    ).subscribe(s => {
      this.scan.set(s);
      if (s.status === 'complete') { this.loadSummary(); this.startWs(); }
    });
    this.api.getScan(this.scanId).subscribe(s => {
      this.scan.set(s);
      if (s.status === 'complete') this.loadSummary();
      if (s.status === 'running') this.startWs();
    });
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); this.ws?.close(); }

  startWs() {
    if (this.ws) return;
    this.ws = new WebSocket(`${environment.wsUrl}/scans/${this.scanId}/progress`);
    this.ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      this.progressPct.set(parseFloat(d.percent ?? 0));
      if (d.elapsed) this.progressElapsed.set(d.elapsed);
    };
  }

  loadSummary() {
    this.api.getScanSummary(this.scanId).subscribe(s => {
      this.summary.set(s);
      const types = Object.keys(s);
      if (types.length) this.histType = types[0];
      this.loadFeatures();
      this.loadHistograms();
      this.api.getAlerts(this.scanId).subscribe(a => this.alerts.set(a));
    });
  }

  setTab(t: Tab) {
    this.activeTab.set(t);
    if (t === 'histograms') this.loadHistograms();
  }

  loadFeatures() {
    this.api.getFeatures(this.scanId, { type: this.selectedType, search: this.searchVal, limit: this.limit, offset: this.page() * this.limit })
      .subscribe(f => this.features.set(f));
  }

  loadHistograms() {
    if (!this.histType) return;
    this.api.getHistograms(this.scanId, this.histType).subscribe(h => this.histograms.set(h));
  }

  onSearch() { this.page.set(0); this.loadFeatures(); }
  prevPage() { if (this.page() > 0) { this.page.update(p => p - 1); this.loadFeatures(); } }
  nextPage() { this.page.update(p => p + 1); this.loadFeatures(); }
}
