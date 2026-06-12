import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell" [class.rail-collapsed]="collapsed()">
      <aside>
        <div class="rail-head">
          <a class="brand" routerLink="/" title="Bulk Extractor">
            <span class="brand-mark">BE</span>
            <span class="rail-label brand-name">bulk_extractor</span>
          </a>
          <button
            class="rail-toggle"
            type="button"
            (click)="collapsed.set(!collapsed())"
            [attr.aria-label]="collapsed() ? 'Expand menu' : 'Collapse menu'"
            [title]="collapsed() ? 'Expand menu' : 'Collapse menu'"
          >
            <span aria-hidden="true">{{ collapsed() ? '›' : '‹' }}</span>
          </button>
        </div>

        <div class="workspace">
          <span class="status-dot"></span>
          <span class="rail-label">
            <strong>OSINT workspace</strong>
            <small>Extractor online</small>
          </span>
        </div>

        <nav aria-label="Primary navigation">
          <span class="section-label rail-label">Workspace</span>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="Dashboard">
            <span class="nav-icon">01</span>
            <span class="rail-label">Dashboard</span>
          </a>
          <a routerLink="/cases" routerLinkActive="active" title="Cases">
            <span class="nav-icon">02</span>
            <span class="rail-label">Cases</span>
          </a>
          <a routerLink="/cases" title="Start a new scan">
            <span class="nav-icon accent">+</span>
            <span class="rail-label">Start scan</span>
          </a>
          <a routerLink="/instructions" routerLinkActive="active" title="How to use this application">
            <span class="nav-icon">?</span>
            <span class="rail-label">Instructions</span>
          </a>
        </nav>

        <div class="services" aria-label="Available services">
          <span class="section-label rail-label">Available services</span>
          @for (service of services; track service.code) {
            <div class="service" [title]="service.name + ': ' + service.detail">
              <span class="service-code">{{ service.code }}</span>
              <span class="rail-label service-copy">
                <strong>{{ service.name }}</strong>
                <small>{{ service.detail }}</small>
              </span>
              <span class="rail-label service-state">Ready</span>
            </div>
          }
        </div>

        <button class="sign-out" type="button" (click)="auth.logout()" title="Sign out">
          <span class="nav-icon">×</span>
          <span class="rail-label">Sign out</span>
        </button>
      </aside>

      <main>
        <header class="mobile-head">
          <button type="button" (click)="collapsed.set(!collapsed())" aria-label="Toggle menu">Menu</button>
          <span>bulk_extractor</span>
        </header>
        <div class="content"><router-outlet /></div>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 272px minmax(0, 1fr);
      background: transparent;
      color: var(--text);
      transition: grid-template-columns .2s ease;
    }
    .shell.rail-collapsed { grid-template-columns: 76px minmax(0, 1fr); }
    aside {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 18px 14px;
      border-right: 1px solid var(--border);
      background: rgba(8, 17, 31, 0.92);
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow: hidden auto;
    }
    .rail-head, .brand, .workspace, nav a, .service, .sign-out {
      display: flex;
      align-items: center;
    }
    .rail-head { min-height: 38px; gap: 8px; }
    .brand { min-width: 0; flex: 1; gap: 10px; color: var(--text); font-size: 15px; font-weight: 700; }
    .brand-mark {
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(77, 212, 198, .42);
      border-radius: 9px;
      background: rgba(77, 212, 198, .14);
      color: var(--accent);
      font-size: 11px;
      letter-spacing: .08em;
    }
    .brand-name { white-space: nowrap; }
    .rail-toggle, .mobile-head button {
      border: 1px solid var(--border);
      background: rgba(148, 163, 184, .08);
      color: var(--muted);
      cursor: pointer;
    }
    .rail-toggle {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      border-radius: 7px;
      font-size: 20px;
      line-height: 1;
    }
    .workspace {
      gap: 10px;
      min-height: 42px;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: rgba(148, 163, 184, .05);
    }
    .workspace strong, .workspace small, .service-copy strong, .service-copy small { display: block; }
    .workspace strong { color: var(--text); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .workspace small { color: var(--muted); font-size: 10px; margin-top: 2px; }
    .status-dot {
      width: 8px;
      height: 8px;
      flex: 0 0 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 0 4px rgba(74, 222, 128, .09);
    }
    nav { display: grid; gap: 5px; }
    .section-label {
      margin: 0 8px 5px;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: .12em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    nav a, .sign-out {
      min-height: 40px;
      gap: 11px;
      padding: 7px 9px;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--muted);
      background: transparent;
      font: inherit;
      font-size: 13px;
      text-align: left;
      white-space: nowrap;
      cursor: pointer;
    }
    nav a.active, nav a:hover, .sign-out:hover {
      color: var(--text);
      background: rgba(77, 212, 198, .08);
      border-color: rgba(77, 212, 198, .34);
    }
    .nav-icon, .service-code {
      width: 26px;
      height: 26px;
      flex: 0 0 26px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      background: rgba(148, 163, 184, .08);
      color: var(--muted);
      font-size: 10px;
    }
    .nav-icon.accent { background: rgba(77, 212, 198, .14); color: var(--accent); font-size: 17px; }
    .services { display: grid; gap: 6px; }
    .service {
      min-height: 52px;
      gap: 10px;
      padding: 7px 8px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: rgba(2, 6, 23, .28);
    }
    .service-code { border: 1px solid rgba(77, 212, 198, .34); color: var(--accent); background: rgba(77, 212, 198, .08); letter-spacing: .05em; }
    .service-copy { min-width: 0; flex: 1; }
    .service-copy strong { color: var(--text); font-size: 12px; font-weight: 500; }
    .service-copy small {
      margin-top: 3px;
      overflow: hidden;
      color: var(--muted);
      font-size: 10px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .service-state { color: var(--success); font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
    .sign-out { width: 100%; margin-top: auto; border-color: var(--border); }
    main { min-width: 0; }
    .content { padding: 32px; }
    .mobile-head { display: none; }
    .rail-collapsed aside { align-items: stretch; padding-inline: 12px; }
    .rail-collapsed .rail-label { display: none; }
    .rail-collapsed .rail-toggle { margin: 0 auto; }
    .rail-collapsed .brand { flex: 0; }
    .rail-collapsed .rail-head { justify-content: center; flex-wrap: wrap; }
    .rail-collapsed .workspace, .rail-collapsed nav a, .rail-collapsed .service, .rail-collapsed .sign-out {
      justify-content: center;
      padding-inline: 6px;
    }
    .rail-collapsed .service { min-height: 42px; }
    @media (max-width: 760px) {
      .shell, .shell.rail-collapsed { display: block; }
      aside {
        position: fixed;
        z-index: 20;
        width: 272px;
        transform: translateX(0);
        transition: transform .2s ease;
        box-shadow: 18px 0 40px rgba(0, 0, 0, .35);
      }
      .rail-collapsed aside { transform: translateX(-100%); }
      .rail-collapsed .rail-label { display: initial; }
      .mobile-head {
        height: 54px;
        padding: 0 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--muted);
        font-size: 11px;
      }
      .mobile-head button { padding: 6px 10px; border-radius: 6px; font-family: inherit; font-size: 10px; }
      .content { padding: 20px 16px; }
    }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);
  collapsed = signal(false);

  services = [
    { code: 'FC', name: 'Feature capture', detail: 'Emails, URLs, phones and identifiers' },
    { code: 'NW', name: 'Network intelligence', detail: 'Domains, IP addresses and web artefacts' },
    { code: 'GM', name: 'Geo and metadata', detail: 'GPS coordinates and EXIF metadata' },
    { code: 'FS', name: 'File system artefacts', detail: 'Windows, archives and file signatures' },
  ];
}
