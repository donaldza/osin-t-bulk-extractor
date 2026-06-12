import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Scan } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1 class="page-title">Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Cases</div><div class="stat-val cyan">{{ cases() }}</div></div>
      <div class="stat-card"><div class="stat-label">Running</div><div class="stat-val" style="color:var(--accent-2)">{{ running() }}</div></div>
      <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-val" style="color:var(--success)">{{ completed() }}</div></div>
      <div class="stat-card"><div class="stat-label">Failed</div><div class="stat-val" style="color:var(--danger)">{{ failed() }}</div></div>
    </div>

    <div class="card">
      <div class="card-head">Recent Scans</div>
      @if (recentScans().length === 0) {
        <p class="empty">No scans yet. <a routerLink="/cases" class="text-cyan">Create a case</a> to get started.</p>
      } @else {
        <table class="be-table">
          <thead><tr><th>Image</th><th>Status</th><th>Size</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            @for (scan of recentScans(); track scan.id) {
              <tr>
                <td style="color:var(--text)">{{ scan.image_path.split('/').pop() }}</td>
                <td><span class="badge {{ scan.status }}">{{ scan.status }}</span></td>
                <td>{{ scan.total_bytes ? (scan.total_bytes / 1e6).toFixed(0) + ' MB' : '—' }}</td>
                <td>{{ scan.elapsed_seconds ? scan.elapsed_seconds.toFixed(1) + 's' : '—' }}</td>
                <td><a [routerLink]="['/scans', scan.id]" class="text-cyan">View</a></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 16px; font-weight: 500; color: var(--text); margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: var(--panel); border: 1px solid var(--border); border-radius: 9px; padding: 14px 16px; }
    .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
    .stat-val { font-size: 22px; font-weight: 500; }
    .empty { padding: 16px; color: var(--muted); font-size: 12px; }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  cases = signal(0);
  running = signal(0);
  completed = signal(0);
  failed = signal(0);
  recentScans = signal<Scan[]>([]);

  ngOnInit() {
    this.api.getCases().pipe(
      switchMap(cases => {
        this.cases.set(cases.length);
        if (!cases.length) return [[]];
        return forkJoin(cases.map(c => this.api.getScans(c.id)));
      })
    ).subscribe((results: Scan[][]) => {
      const all = results.flat();
      this.running.set(all.filter(s => s.status === 'running').length);
      this.completed.set(all.filter(s => s.status === 'complete').length);
      this.failed.set(all.filter(s => s.status === 'failed').length);
      this.recentScans.set([...all].sort((a, b) => b.id - a.id).slice(0, 8));
    });
  }
}
