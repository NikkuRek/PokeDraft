import { api } from '../services/api.js';

export const renderLeaderboardView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 4rem;">
        <h2>Selecciona una Liga</h2>
        <p style="color: var(--text-muted); margin: 1rem 0;">Por favor selecciona una liga para ver la tabla de clasificación y ranking MVP.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Clasificación & Ranking MVP</h1>
        <p class="subtitle">Tabla de posiciones general y los Pokémon más letales de la temporada</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="btn-tab-standings" class="btn btn-primary btn-sm">🏆 Tabla de Posiciones</button>
        <button id="btn-tab-mvp" class="btn btn-secondary btn-sm">⭐ Ranking MVP Pokémon</button>
      </div>
    </div>

    <div id="leaderboard-content">
      <div class="card" style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">Cargando estadísticas...</p>
      </div>
    </div>
  `;

  let activeTab: 'standings' | 'mvp' = 'standings';

  const loadData = async () => {
    try {
      const content = document.getElementById('leaderboard-content');
      if (!content) return;

      if (activeTab === 'standings') {
        const standings = await api.getStandings(leagueId);
        content.innerHTML = `
          <div class="table-container card" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50px;">Pos</th>
                  <th>Entrenador / Equipo</th>
                  <th style="text-align: center;">PJ</th>
                  <th style="text-align: center;">V</th>
                  <th style="text-align: center;">D</th>
                  <th style="text-align: center;">Diferencial (+/-)</th>
                  <th style="text-align: center; color: var(--accent-gold);">Puntos</th>
                </tr>
              </thead>
              <tbody>
                ${standings.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidos jugados todavía.</td></tr>' : ''}
                ${standings
                  .map(
                    (s, index) => `
                  <tr>
                    <td style="font-weight: 800; color: ${index === 0 ? 'var(--accent-gold)' : index < 4 ? 'var(--accent-primary)' : 'var(--text-dim)'}; text-align: center;">
                      #${index + 1}
                    </td>
                    <td>
                      <div style="font-weight: 700;">${s.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${s.team_name}</div>
                    </td>
                    <td style="text-align: center;">${s.played}</td>
                    <td style="text-align: center; color: var(--accent-green); font-weight: 700;">${s.wins}</td>
                    <td style="text-align: center; color: var(--accent-red); font-weight: 700;">${s.losses}</td>
                    <td style="text-align: center; font-weight: 700; color: ${s.differential > 0 ? 'var(--accent-green)' : s.differential < 0 ? 'var(--accent-red)' : 'var(--text-muted)'};">
                      ${s.differential > 0 ? `+${s.differential}` : s.differential}
                    </td>
                    <td style="text-align: center; font-weight: 800; font-size: 1.1rem; color: var(--accent-gold);">${s.points}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        const mvpList = await api.getMvpRanking(leagueId);
        content.innerHTML = `
          <div class="table-container card" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50px;">Rank</th>
                  <th>Pokémon</th>
                  <th>Tipos</th>
                  <th>Entrenador</th>
                  <th style="text-align: center; color: var(--accent-red);">Kills</th>
                  <th style="text-align: center;">Deaths</th>
                  <th style="text-align: center; color: var(--accent-gold);">Ratio K/D</th>
                </tr>
              </thead>
              <tbody>
                ${mvpList.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay estadísticas individuales registradas todavía.</td></tr>' : ''}
                ${mvpList
                  .map(
                    (p, index) => `
                  <tr>
                    <td style="font-weight: 800; color: ${index === 0 ? 'var(--accent-gold)' : 'var(--text-muted)'}; text-align: center;">
                      #${index + 1}
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${p.sprite_animated_url || p.sprite_url}" style="width: 36px; height: 36px; object-fit: contain;" />
                        <span style="font-weight: 700;">${p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span class="type-badge type-${p.type1.toLowerCase()}">${p.type1}</span>
                      ${p.type2 ? `<span class="type-badge type-${p.type2.toLowerCase()}">${p.type2}</span>` : ''}
                    </td>
                    <td>
                      <div style="font-weight: 600;">${p.coach_name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${p.team_name}</div>
                    </td>
                    <td style="text-align: center; font-weight: 800; color: var(--accent-red); font-size: 1rem;">${p.kills}</td>
                    <td style="text-align: center; color: var(--text-dim);">${p.deaths}</td>
                    <td style="text-align: center; font-weight: 800; color: var(--accent-gold);">${p.kd_ratio}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
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
    btnMvp.className = 'btn btn-secondary btn-sm';
    await loadData();
  });

  btnMvp.addEventListener('click', async () => {
    activeTab = 'mvp';
    btnMvp.className = 'btn btn-primary btn-sm';
    btnStandings.className = 'btn btn-secondary btn-sm';
    await loadData();
  });

  await loadData();
};
