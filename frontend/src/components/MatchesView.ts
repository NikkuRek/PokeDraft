import { api } from '../services/api.js';
import { IMatch } from '../types/index.js';

export const renderMatchesView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 4rem;">
        <h2>Selecciona una Liga</h2>
        <p style="color: var(--text-muted); margin: 1rem 0;">Por favor selecciona una liga para ver el calendario de partidos.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Calendario de Batallas & Resultados</h1>
        <p class="subtitle">Registra los marcadores semanales y estadísticas individuales por Pokémon</p>
      </div>
      <button id="btn-generate-fixture" class="btn btn-primary">⚡ Generar Fixture Round-Robin</button>
    </div>

    <div id="matches-list-container">
      <div class="card" style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">Cargando partidos...</p>
      </div>
    </div>
  `;

  const loadMatches = async () => {
    try {
      const matches = await api.getMatches(leagueId);
      const listContainer = document.getElementById('matches-list-container');
      if (!listContainer) return;

      if (matches.length === 0) {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem;">
            <h3>No hay partidos generados todavía</h3>
            <p style="color: var(--text-muted); margin: 1rem 0;">Haz clic en el botón superior para crear el calendario de todas las jornadas.</p>
          </div>
        `;
        return;
      }

      // Group matches by week
      const matchesByWeek: Record<number, IMatch[]> = {};
      matches.forEach((m) => {
        if (!matchesByWeek[m.week]) matchesByWeek[m.week] = [];
        matchesByWeek[m.week].push(m);
      });

      listContainer.innerHTML = Object.entries(matchesByWeek)
        .map(
          ([week, weekMatches]) => `
          <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--accent-primary);">📅 Semana / Jornada ${week}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1rem;">
              ${weekMatches
                .map(
                  (m) => `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="font-weight: 700; flex: 1;">
                      <div>${m.HomeCoach?.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-dim);">${m.HomeCoach?.team_name}</div>
                    </div>
                    <div style="font-size: 1.25rem; font-weight: 800; padding: 0.25rem 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm);">
                      ${m.status === 'COMPLETED' ? `${m.home_score} - ${m.away_score}` : 'VS'}
                    </div>
                    <div style="font-weight: 700; flex: 1; text-align: right;">
                      <div>${m.AwayCoach?.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-dim);">${m.AwayCoach?.team_name}</div>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                    <span style="font-size: 0.8rem; color: ${m.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--text-dim)'};">
                      ${m.status === 'COMPLETED' ? '✅ Finalizado' : '⏳ Pendiente'}
                    </span>
                    <button class="btn btn-secondary btn-sm btn-record-result" data-id="${m.id}">
                      ${m.status === 'COMPLETED' ? '✏️ Editar Resultado' : '📝 Registrar Resultado'}
                    </button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('');

      listContainer.querySelectorAll('.btn-record-result').forEach((btn) => {
        btn.addEventListener('click', () => {
          const matchId = parseInt(btn.getAttribute('data-id')!, 10);
          const match = matches.find((m) => m.id === matchId);
          if (match) openResultModal(match);
        });
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const openResultModal = async (match: IMatch) => {
    try {
      const [homeRosterData, awayRosterData] = await Promise.all([
        api.getCoachRoster(match.home_coach_id),
        api.getCoachRoster(match.away_coach_id)
      ]);

      const modalBackdrop = document.getElementById('modal-container')!;
      modalBackdrop.classList.remove('hidden');
      modalBackdrop.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
          <h2>Registrar Resultado - Jornada ${match.week}</h2>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0; padding: 1rem; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-sm);">
            <div style="text-align: center; flex: 1;">
              <strong>${match.HomeCoach?.name}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${match.HomeCoach?.team_name}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="number" id="input-home-score" class="input-search" style="width: 60px; text-align: center; font-size: 1.1rem;" value="${match.home_score || 0}" min="0" max="6" />
              <span>-</span>
              <input type="number" id="input-away-score" class="input-search" style="width: 60px; text-align: center; font-size: 1.1rem;" value="${match.away_score || 0}" min="0" max="6" />
            </div>
            <div style="text-align: center; flex: 1;">
              <strong>${match.AwayCoach?.name}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${match.AwayCoach?.team_name}</div>
            </div>
          </div>

          <form id="form-match-result">
            <h4 style="margin: 1rem 0 0.5rem;">Kills de Pokémon (${match.HomeCoach?.name})</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin-bottom: 1rem;">
              ${homeRosterData.roster.map((r) => `
                <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: var(--radius-sm);">
                  <img src="${r.Pokemon?.sprite_animated_url || r.Pokemon?.sprite_url}" style="width: 28px; height: 28px; object-fit: contain;" />
                  <div style="flex: 1; font-size: 0.8rem; font-weight: 600;">${r.Pokemon?.name}</div>
                  <input type="number" class="input-search poke-kill-home" data-pokeid="${r.pokemon_id}" style="width: 45px; padding: 2px 4px; text-align: center;" value="0" min="0" max="6" />
                </div>
              `).join('')}
            </div>

            <h4 style="margin: 1rem 0 0.5rem;">Kills de Pokémon (${match.AwayCoach?.name})</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin-bottom: 1rem;">
              ${awayRosterData.roster.map((r) => `
                <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: var(--radius-sm);">
                  <img src="${r.Pokemon?.sprite_animated_url || r.Pokemon?.sprite_url}" style="width: 28px; height: 28px; object-fit: contain;" />
                  <div style="flex: 1; font-size: 0.8rem; font-weight: 600;">${r.Pokemon?.name}</div>
                  <input type="number" class="input-search poke-kill-away" data-pokeid="${r.pokemon_id}" style="width: 45px; padding: 2px 4px; text-align: center;" value="0" min="0" max="6" />
                </div>
              `).join('')}
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
              <button type="button" id="btn-cancel-result" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Resultado</button>
            </div>
          </form>
        </div>
      `;

      document.getElementById('btn-cancel-result')?.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
      });

      document.getElementById('form-match-result')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const home_score = parseInt((document.getElementById('input-home-score') as HTMLInputElement).value, 10);
        const away_score = parseInt((document.getElementById('input-away-score') as HTMLInputElement).value, 10);

        const pokemonStats: any[] = [];

        document.querySelectorAll('.poke-kill-home').forEach((el: any) => {
          const kills = parseInt(el.value, 10) || 0;
          const pokemon_id = parseInt(el.getAttribute('data-pokeid'), 10);
          if (kills > 0) {
            pokemonStats.push({ coach_id: match.home_coach_id, pokemon_id, kills, died: false });
          }
        });

        document.querySelectorAll('.poke-kill-away').forEach((el: any) => {
          const kills = parseInt(el.value, 10) || 0;
          const pokemon_id = parseInt(el.getAttribute('data-pokeid'), 10);
          if (kills > 0) {
            pokemonStats.push({ coach_id: match.away_coach_id, pokemon_id, kills, died: false });
          }
        });

        try {
          await api.recordMatchResult(match.id, {
            home_score,
            away_score,
            pokemon_stats: pokemonStats
          });
          showToast('Resultado y estadísticas guardadas exitosamente.');
          modalBackdrop.classList.add('hidden');
          await loadMatches();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    } catch (e: any) {
      showToast(e.message, true);
    }
  };

  document.getElementById('btn-generate-fixture')?.addEventListener('click', async () => {
    try {
      await api.generateFixture(leagueId);
      showToast('Fixture generado con éxito.');
      await loadMatches();
    } catch (e: any) {
      showToast(e.message, true);
    }
  });

  await loadMatches();
};
