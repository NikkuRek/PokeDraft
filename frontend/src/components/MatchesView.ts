import { api } from '../services/api.js';
import { IMatch } from '../types/index.js';
import { escapeHtml, renderPokemonSprite } from '../utils/format.js';
import { icon } from '../utils/icons.js';

export const renderMatchesView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card empty-panel">
        <div class="empty-panel-icon">${icon('matches')}</div>
        <h2>Selecciona una Liga</h2>
        <p class="subtitle">Elige una liga en el menú superior para consultar el calendario Round-Robin y registrar marcadores.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('matches')}<span>Calendario Premier (Bo1 · Ida y Vuelta)</span></h1>
        <p class="subtitle">Emparejamientos al azar por jornada ida y vuelta con registro de marcador y bajas por Pokémon</p>
      </div>
      <div class="section-actions">
        <button type="button" id="btn-generate-fixture" class="btn btn-primary">
          ${icon('bolt')}
          <span>Generar Ida y Vuelta (Azar)</span>
        </button>
      </div>
    </div>

    <div id="matches-week-tabs-slot"></div>

    <div id="matches-list-container">
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  `;

  let allMatches: IMatch[] = [];
  let selectedLeg: 'ALL' | 1 | 2 = 'ALL';
  let selectedWeek: number | 'ALL' = 'ALL';

  const openResultModal = async (match: IMatch) => {
    try {
      const [homeRosterData, awayRosterData] = await Promise.all([
        api.getCoachRoster(match.home_coach_id),
        api.getCoachRoster(match.away_coach_id)
      ]);

      const modalBackdrop = document.getElementById('modal-container');
      if (!modalBackdrop) return;
      modalBackdrop.classList.remove('hidden');

      modalBackdrop.innerHTML = `
        <div class="modal-content modal-content--wide">
          <div class="modal-header">
            <h2>Registrar Resultado — Jornada ${match.week}</h2>
            <button type="button" id="btn-close-result-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
              ${icon('close')}
            </button>
          </div>

          <div class="neo-well" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px;">
              <strong>${escapeHtml(match.HomeCoach?.name || 'Local')}</strong>
              <div style="font-size: 0.78rem; color: var(--ink-muted);">${escapeHtml(match.HomeCoach?.team_name || '')}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="number" id="input-home-score" class="input-well mono-num" style="width: 66px; text-align: center; font-size: 1.15rem; font-weight: 700;" value="${match.home_score || 0}" min="0" max="6" inputmode="numeric" aria-label="Marcador local" />
              <span style="font-weight: 700; color: var(--ink-muted);">-</span>
              <input type="number" id="input-away-score" class="input-well mono-num" style="width: 66px; text-align: center; font-size: 1.15rem; font-weight: 700;" value="${match.away_score || 0}" min="0" max="6" inputmode="numeric" aria-label="Marcador visitante" />
            </div>

            <div style="flex: 1; min-width: 140px; text-align: right;">
              <strong>${escapeHtml(match.AwayCoach?.name || 'Visitante')}</strong>
              <div style="font-size: 0.78rem; color: var(--ink-muted);">${escapeHtml(match.AwayCoach?.team_name || '')}</div>
            </div>
          </div>

          <form id="form-match-result">
            <h3 style="font-size: 0.96rem; margin-bottom: 0.6rem;">Kills de Pokémon (${escapeHtml(match.HomeCoach?.name || '')})</h3>
            <div class="match-kill-grid">
              ${homeRosterData.roster
                .map(
                  (r) => `
                  <div class="neo-well match-kill-item">
                    <div class="mini-socket">${r.Pokemon ? renderPokemonSprite(r.Pokemon, 'mini-sprite', false, { size: 32 }) : ''}</div>
                    <div style="flex: 1; font-size: 0.82rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${escapeHtml(r.Pokemon?.name || '')}
                    </div>
                    <input type="number" class="input-well match-kill-input poke-kill-home" data-pokeid="${r.pokemon_id}" value="0" min="0" max="6" inputmode="numeric" aria-label="Kills de ${escapeHtml(r.Pokemon?.name || '')}" />
                  </div>
                `
                )
                .join('')}
            </div>

            <h3 style="font-size: 0.96rem; margin-bottom: 0.6rem;">Kills de Pokémon (${escapeHtml(match.AwayCoach?.name || '')})</h3>
            <div class="match-kill-grid">
              ${awayRosterData.roster
                .map(
                  (r) => `
                  <div class="neo-well match-kill-item">
                    <div class="mini-socket">${r.Pokemon ? renderPokemonSprite(r.Pokemon, 'mini-sprite', false, { size: 32 }) : ''}</div>
                    <div style="flex: 1; font-size: 0.82rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${escapeHtml(r.Pokemon?.name || '')}
                    </div>
                    <input type="number" class="input-well match-kill-input poke-kill-away" data-pokeid="${r.pokemon_id}" value="0" min="0" max="6" inputmode="numeric" aria-label="Kills de ${escapeHtml(r.Pokemon?.name || '')}" />
                  </div>
                `
                )
                .join('')}
            </div>

            <div class="modal-actions">
              <button type="button" id="btn-cancel-result" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">${icon('check')}<span>Guardar Resultado</span></button>
            </div>
          </form>
        </div>
      `;

      const closeModal = () => modalBackdrop.classList.add('hidden');
      document.getElementById('btn-cancel-result')?.addEventListener('click', closeModal);
      document.getElementById('btn-close-result-top')?.addEventListener('click', closeModal);

      document.getElementById('form-match-result')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const home_score = parseInt((document.getElementById('input-home-score') as HTMLInputElement).value, 10);
        const away_score = parseInt((document.getElementById('input-away-score') as HTMLInputElement).value, 10);
        const pokemonStats: any[] = [];

        document.querySelectorAll('.poke-kill-home').forEach((el) => {
          const input = el as HTMLInputElement;
          const kills = parseInt(input.value, 10) || 0;
          const pokemon_id = parseInt(input.getAttribute('data-pokeid')!, 10);
          if (kills > 0) {
            pokemonStats.push({ coach_id: match.home_coach_id, pokemon_id, kills, died: false });
          }
        });

        document.querySelectorAll('.poke-kill-away').forEach((el) => {
          const input = el as HTMLInputElement;
          const kills = parseInt(input.value, 10) || 0;
          const pokemon_id = parseInt(input.getAttribute('data-pokeid')!, 10);
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
          showToast('Resultado y estadísticas guardados.');
          closeModal();
          await loadMatches();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    } catch (e: any) {
      showToast(e.message, true);
    }
  };

  const renderMatchesContent = () => {
    const tabsSlot = document.getElementById('matches-week-tabs-slot');
    const listContainer = document.getElementById('matches-list-container');
    if (!listContainer || !tabsSlot) return;

    if (allMatches.length === 0) {
      tabsSlot.innerHTML = '';
      listContainer.innerHTML = `
        <div class="card empty-panel">
          <div class="empty-panel-icon">${icon('matches')}</div>
          <h3>No hay partidos generados todavía</h3>
          <p class="subtitle">Pulsa el botón superior para generar automáticamente el calendario Round-Robin entre los entrenadores inscritos.</p>
        </div>
      `;
      return;
    }

    const filteredByLeg =
      selectedLeg === 'ALL' ? allMatches : allMatches.filter((m) => (m.leg ?? 1) === selectedLeg);

    const matchesByWeek: Record<number, IMatch[]> = {};
    filteredByLeg.forEach((m) => {
      if (!matchesByWeek[m.week]) matchesByWeek[m.week] = [];
      matchesByWeek[m.week].push(m);
    });

    const weeks = Object.keys(matchesByWeek)
      .map(Number)
      .sort((a, b) => a - b);

    if (selectedWeek !== 'ALL' && !weeks.includes(selectedWeek)) {
      selectedWeek = 'ALL';
    }

    tabsSlot.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.55rem; margin-bottom:1.15rem;">
        <div class="segmented-dock" style="align-self:flex-start;" role="tablist" aria-label="Filtrar por vuelta">
          <button type="button" class="btn btn-sm ${selectedLeg === 'ALL' ? 'btn-primary' : 'btn-ghost'} leg-tab-btn" data-leg="ALL">Ambas Vueltas</button>
          <button type="button" class="btn btn-sm ${selectedLeg === 1 ? 'btn-primary' : 'btn-ghost'} leg-tab-btn" data-leg="1">Ida (1ª Vuelta)</button>
          <button type="button" class="btn btn-sm ${selectedLeg === 2 ? 'btn-primary' : 'btn-ghost'} leg-tab-btn" data-leg="2">Vuelta (2ª Vuelta)</button>
        </div>

        <div class="week-tabs" style="margin-bottom:0;" role="tablist" aria-label="Filtrar por jornada">
          <button type="button" class="week-tab-btn ${selectedWeek === 'ALL' ? 'active' : ''}" data-week="ALL">Todas (${weeks.length})</button>
          ${weeks
            .map(
              (w) =>
                `<button type="button" class="week-tab-btn ${selectedWeek === w ? 'active' : ''}" data-week="${w}">J${w}</button>`
            )
            .join('')}
        </div>
      </div>
    `;

    const visibleWeeks = selectedWeek === 'ALL' ? weeks : weeks.filter((w) => w === selectedWeek);

    listContainer.innerHTML = visibleWeeks
      .map((week) => {
        const weekMatches = matchesByWeek[week] || [];
        const legNumber = weekMatches[0]?.leg ?? 1;
        const legLabel = legNumber === 2 ? 'Vuelta' : 'Ida';
        return `
          <section class="week-section">
            <h2 class="week-heading">${icon('clock')}<span>${legLabel} · Jornada ${week} (Bo1)</span></h2>
            <div class="matches-grid">
              ${weekMatches
                .map((m) => {
                  const isDone = m.status === 'COMPLETED';
                  const homeWon = isDone && m.home_score > m.away_score;
                  const awayWon = isDone && m.away_score > m.home_score;

                  return `
                    <article class="card match-pod ${isDone ? 'match-pod--completed' : ''}">
                      <div class="match-versus">
                        <div class="match-side">
                          <div class="match-coach ${homeWon ? 'is-winner' : ''}">${escapeHtml(m.HomeCoach?.name || 'Local')}</div>
                          <div class="match-team">${escapeHtml(m.HomeCoach?.team_name || '')}</div>
                        </div>

                        <div class="neo-well score-well">
                          ${isDone ? `${m.home_score} - ${m.away_score}` : 'VS'}
                        </div>

                        <div class="match-side match-side--away">
                          <div class="match-coach ${awayWon ? 'is-winner' : ''}">${escapeHtml(m.AwayCoach?.name || 'Visitante')}</div>
                          <div class="match-team">${escapeHtml(m.AwayCoach?.team_name || '')}</div>
                        </div>
                      </div>

                      <div class="match-footer">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span class="status-pill ${isDone ? 'status-active' : 'status-setup'}">
                            <span class="status-dot" aria-hidden="true"></span>
                            <span>${isDone ? 'Finalizado' : 'Pendiente'}</span>
                          </span>
                          ${
                            m.replay_url
                              ? `<a href="${escapeHtml(m.replay_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">${icon('external')}<span>Replay</span></a>`
                              : ''
                          }
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm btn-record-result" data-id="${m.id}">
                          ${icon('edit')}
                          <span>${isDone ? 'Editar Resultado' : 'Registrar Resultado'}</span>
                        </button>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          </section>
        `;
      })
      .join('');
  };

  document.getElementById('matches-week-tabs-slot')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const legBtn = target.closest<HTMLButtonElement>('.leg-tab-btn');
    if (legBtn) {
      const val = legBtn.getAttribute('data-leg');
      selectedLeg = val === 'ALL' ? 'ALL' : (parseInt(val!, 10) as 1 | 2);
      selectedWeek = 'ALL';
      renderMatchesContent();
      return;
    }

    const btn = target.closest<HTMLButtonElement>('.week-tab-btn');
    if (!btn) return;
    const val = btn.getAttribute('data-week');
    selectedWeek = val === 'ALL' ? 'ALL' : parseInt(val!, 10);
    renderMatchesContent();
  });

  document.getElementById('matches-list-container')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-record-result');
    if (!btn) return;
    const matchId = parseInt(btn.getAttribute('data-id') || '', 10);
    const match = allMatches.find((m) => m.id === matchId);
    if (match) openResultModal(match);
  });

  const loadMatches = async () => {
    try {
      allMatches = await api.getMatches(leagueId);
      renderMatchesContent();
    } catch (err: any) {
      showToast(err.message, true);
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
