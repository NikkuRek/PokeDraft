import { api } from '../services/api.js';
import { escapeHtml, renderPokemonSprite, renderTypeBadge } from '../utils/format.js';
import { icon } from '../utils/icons.js';

export const renderLeaderboardView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card empty-panel">
        <div class="empty-panel-icon">${icon('leaderboard')}</div>
        <h2>Selecciona una Liga</h2>
        <p class="subtitle">Por favor selecciona una liga para consultar la tabla de clasificación y el ranking MVP.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('leaderboard')}<span>Clasificación & Ranking MVP</span></h1>
        <p class="subtitle">Tabla de posiciones general y los Pokémon más letales de la temporada</p>
      </div>
      <div class="segmented-dock" role="tablist" aria-label="Vistas de clasificación">
        <button type="button" id="btn-tab-standings" class="btn btn-primary btn-sm" role="tab" aria-selected="true">
          ${icon('leagues')}
          <span>Tabla de Posiciones</span>
        </button>
        <button type="button" id="btn-tab-mvp" class="btn btn-ghost btn-sm" role="tab" aria-selected="false">
          ${icon('bolt')}
          <span>Ranking MVP Pokémon</span>
        </button>
      </div>
    </div>

    <div id="leaderboard-content">
      <div class="skeleton-card" style="height: 320px;"></div>
    </div>
  `;

  let activeTab: 'standings' | 'mvp' = 'standings';

  const rankBadgeClass = (index: number, total: number) => {
    if (index === 0) return 'rank-pill rank-pill--1';
    if (index === 1) return 'rank-pill rank-pill--2';
    if (index === 2) return 'rank-pill rank-pill--3';
    if (index === 3 && total > 4) return 'rank-pill rank-pill--playoff';
    return 'rank-pill';
  };

  const loadData = async () => {
    try {
      const content = document.getElementById('leaderboard-content');
      if (!content) return;

      if (activeTab === 'standings') {
        const standings = await api.getStandings(leagueId);
        content.innerHTML = `
          <div class="card table-shell">
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 72px; text-align: center;">Pos</th>
                    <th>Entrenador / Equipo</th>
                    <th style="text-align: center;">PJ</th>
                    <th style="text-align: center;">V</th>
                    <th style="text-align: center;">D</th>
                    <th style="text-align: center;">Diferencial (+/-)</th>
                    <th style="text-align: center; color: var(--dex-gold);">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    standings.length === 0
                      ? '<tr><td colspan="7" style="text-align: center; color: var(--ink-muted); padding: 2.5rem;">No hay partidos jugados todavía.</td></tr>'
                      : standings
                          .map(
                            (s, index) => `
                            <tr class="${index === 3 && standings.length > 4 ? 'row-cutline' : ''}">
                              <td style="text-align: center;">
                                <span class="${rankBadgeClass(index, standings.length)}">#${index + 1}</span>
                              </td>
                              <td>
                                <div style="font-weight: 700;">${escapeHtml(s.name)}</div>
                                <div style="font-size: 0.78rem; color: var(--ink-muted);">${escapeHtml(s.team_name)}</div>
                              </td>
                              <td class="mono-num" style="text-align: center;">${s.played}</td>
                              <td class="mono-num" style="text-align: center; color: #6ee7b7; font-weight: 700;">${s.wins}</td>
                              <td class="mono-num" style="text-align: center; color: #fca5a5; font-weight: 700;">${s.losses}</td>
                              <td class="mono-num" style="text-align: center; font-weight: 700; color: ${
                                s.differential > 0 ? '#6ee7b7' : s.differential < 0 ? '#fca5a5' : 'var(--ink-secondary)'
                              };">
                                ${s.differential > 0 ? `+${s.differential}` : s.differential}
                              </td>
                              <td class="mono-num" style="text-align: center; font-weight: 700; font-size: 1.05rem; color: var(--dex-gold);">
                                ${s.points}
                              </td>
                            </tr>
                          `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        const mvpList = await api.getMvpRanking(leagueId);
        content.innerHTML = `
          <div class="card table-shell">
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 72px; text-align: center;">Rank</th>
                    <th>Pokémon</th>
                    <th>Tipos</th>
                    <th>Entrenador</th>
                    <th style="text-align: center; color: #ff8e97;">Kills</th>
                    <th style="text-align: center;">Deaths</th>
                    <th style="text-align: center; color: var(--dex-gold);">Ratio K/D</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    mvpList.length === 0
                      ? '<tr><td colspan="7" style="text-align: center; color: var(--ink-muted); padding: 2.5rem;">No hay estadísticas individuales registradas todavía.</td></tr>'
                      : mvpList
                          .map(
                            (p, index) => `
                            <tr>
                              <td style="text-align: center;">
                                <span class="${rankBadgeClass(index, mvpList.length)}">#${index + 1}</span>
                              </td>
                              <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                  <div class="mini-socket">${renderPokemonSprite(p, 'mini-sprite')}</div>
                                  <span style="font-weight: 700;">${escapeHtml(p.name)}</span>
                                </div>
                              </td>
                              <td>
                                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                                  ${renderTypeBadge(p.type1)}
                                  ${p.type2 ? renderTypeBadge(p.type2) : ''}
                                </div>
                              </td>
                              <td>
                                <div style="font-weight: 600;">${escapeHtml(p.coach_name)}</div>
                                <div style="font-size: 0.78rem; color: var(--ink-muted);">${escapeHtml(p.team_name)}</div>
                              </td>
                              <td class="mono-num" style="text-align: center; font-weight: 700; color: #ff8e97; font-size: 1rem;">
                                ${p.kills}
                              </td>
                              <td class="mono-num" style="text-align: center; color: var(--ink-secondary);">${p.deaths}</td>
                              <td class="mono-num" style="text-align: center; font-weight: 700; color: var(--dex-gold);">
                                ${p.kd_ratio}
                              </td>
                            </tr>
                          `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const btnStandings = document.getElementById('btn-tab-standings')!;
  const btnMvp = document.getElementById('btn-tab-mvp')!;

  btnStandings.addEventListener('click', async () => {
    activeTab = 'standings';
    btnStandings.className = 'btn btn-primary btn-sm';
    btnStandings.setAttribute('aria-selected', 'true');
    btnMvp.className = 'btn btn-ghost btn-sm';
    btnMvp.setAttribute('aria-selected', 'false');
    await loadData();
  });

  btnMvp.addEventListener('click', async () => {
    activeTab = 'mvp';
    btnMvp.className = 'btn btn-primary btn-sm';
    btnMvp.setAttribute('aria-selected', 'true');
    btnStandings.className = 'btn btn-ghost btn-sm';
    btnStandings.setAttribute('aria-selected', 'false');
    await loadData();
  });

  await loadData();
};
