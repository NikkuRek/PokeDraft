import { api } from '../services/api.js';
import { enrichPokemonListFromPokeApi } from '../services/pokeapi.js';
import { ICoach, IRosterEntry } from '../types/index.js';
import {
  escapeHtml,
  formatDexNumber,
  renderPokemonSprite,
  renderTypeBadge,
  statBarPercent,
  statTierClass
} from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openPokemonDetailModal } from './PokemonDetailModal.js';

export const renderRosterHubView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card empty-panel">
        <div class="empty-panel-icon">${icon('rosters')}</div>
        <h2>Selecciona una Liga</h2>
        <p class="subtitle">Por favor selecciona una liga en el menú superior para inspeccionar plantillas y coberturas defensivas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('rosters')}<span>Plantillas & Coberturas de Equipo</span></h1>
        <p class="subtitle">Analiza las debilidades elementales de 18 tipos y exporta directamente a Pokémon Showdown</p>
      </div>
      <div class="section-actions">
        <select id="roster-coach-select" class="select-input" aria-label="Seleccionar entrenador"></select>
        <button type="button" id="btn-export-showdown" class="btn btn-secondary">
          ${icon('copy')}
          <span>Exportar Showdown</span>
        </button>
        <button type="button" id="btn-free-agency" class="btn btn-primary">
          ${icon('swap')}
          <span>Free Agency</span>
        </button>
      </div>
    </div>

    <div id="roster-main-content">
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  `;

  let coaches: ICoach[] = [];
  let selectedCoachId: number | null = null;
  let currentShowdownExport = '';

  const renderRosterDetails = (data: { coach: ICoach; roster: IRosterEntry[]; coverage: any }) => {
    const mainContent = document.getElementById('roster-main-content');
    if (!mainContent) return;

    const { coach, roster, coverage } = data;
    const validRoster = roster.filter((r) => Boolean(r.Pokemon));
    const avgBst =
      validRoster.length > 0
        ? Math.round(validRoster.reduce((acc, r) => acc + (r.Pokemon?.base_bst || 0), 0) / validRoster.length)
        : 0;

    mainContent.innerHTML = `
      <div class="roster-summary-deck">
        <div class="neo-well summary-well">
          <span class="summary-well-label">Entrenador / Franquicia</span>
          <span class="summary-well-value">${escapeHtml(coach.name)} · ${escapeHtml(coach.team_name)}</span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">Plantilla Activa</span>
          <span class="summary-well-value mono-num">${roster.length} Pokémon</span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">Presupuesto Restante</span>
          <span class="summary-well-value mono-num" style="color: var(--dex-gold);">${coach.remaining_budget} pts</span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">BST Promedio</span>
          <span class="summary-well-value mono-num" style="color: var(--dex-cyan);">${avgBst}</span>
        </div>
      </div>

      <section aria-label="Pokémon en plantilla activa">
        ${
          roster.length === 0
            ? `
          <div class="card empty-panel" style="margin-bottom: 1.75rem;">
            <div class="empty-panel-icon">${icon('pokeball')}</div>
            <h3>Plantilla vacía</h3>
            <p class="subtitle">Este entrenador todavía no ha drafteado ningún Pokémon en esta liga.</p>
          </div>
        `
            : `
          <div class="roster-grid">
            ${roster
              .map((entry) => {
                const p = entry.Pokemon;
                if (!p) return '';
                const stats = [
                  { key: 'HP', val: p.base_hp },
                  { key: 'ATK', val: p.base_atk },
                  { key: 'DEF', val: p.base_def },
                  { key: 'SPA', val: p.base_spa },
                  { key: 'SPD', val: p.base_spd },
                  { key: 'SPE', val: p.base_spe }
                ];

                return `
                  <article class="card roster-card">
                    <div class="roster-card-head">
                      <span class="dex-number">${formatDexNumber(p.dex_number)}</span>
                      <div style="display: flex; align-items: center; gap: 0.4rem;">
                        ${entry.is_tera_captain ? '<span class="tera-pill">TERA</span>' : ''}
                        <span class="pokemon-cost-badge">${entry.cost_paid} pts</span>
                      </div>
                    </div>

                    <div class="roster-sprite-stage">
                      <div class="poke-slot-well">${renderPokemonSprite(p)}</div>
                      <button type="button" class="pokemon-name-btn btn-roster-inspect" data-poke-id="${p.id}" title="Ver ficha Pokédex de ${escapeHtml(p.name)}">
                        <span>${escapeHtml(p.name)}</span>
                      </button>
                      <div class="pokemon-types-row" style="margin-bottom: 0.25rem;">
                        ${renderTypeBadge(p.type1)}
                        ${p.type2 ? renderTypeBadge(p.type2) : ''}
                      </div>
                    </div>

                    <div class="stat-bars-grid">
                      ${stats
                        .map(
                          (s) => `
                          <div class="stat-row">
                            <span class="stat-label">${s.key}</span>
                            <div class="stat-track">
                              <div class="stat-fill ${statTierClass(s.val)}" style="width: ${statBarPercent(s.val)}%;"></div>
                            </div>
                            <span class="stat-val">${s.val}</span>
                          </div>
                        `
                        )
                        .join('')}
                    </div>

                    <div class="mono-num" style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--ink-muted);">
                      <span>BST Total</span>
                      <strong style="color: var(--ink-primary);">${p.base_bst}</strong>
                    </div>
                  </article>
                `;
              })
              .join('')}
          </div>
        `
        }
      </section>

      <section class="card" aria-label="Matriz de coberturas defensivas">
        <h2 class="panel-heading">
          <span class="panel-heading-left">${icon('sliders')}<span>Matriz de Coberturas Defensivas (18 Tipos)</span></span>
        </h2>
        <p class="subtitle" style="margin-top: 0;">
          Cantidad de Pokémon de la plantilla que resisten, son inmunes o son débiles ante cada tipo atacante. Las casillas en carmesí señalan vulnerabilidades sin resistencia ni inmunidad.
        </p>

        <div class="coverage-grid">
          ${Object.entries(coverage || {})
            .map(([type, stats]: [string, any]) => {
              const isDanger = Number(stats.weak) >= 3 && Number(stats.resist) + Number(stats.immune) === 0;
              return `
                <div class="coverage-tile ${isDanger ? 'coverage-tile--danger' : ''}">
                  ${renderTypeBadge(type, true)}
                  <div class="coverage-stats">
                    <div class="cov-row cov-resist"><span>Resiste</span><strong>${stats.resist}</strong></div>
                    <div class="cov-row cov-immune"><span>Inmune</span><strong>${stats.immune}</strong></div>
                    <div class="cov-row cov-weak"><span>Débil</span><strong>${stats.weak}</strong></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </section>
    `;

    mainContent.querySelectorAll('.btn-roster-inspect').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pokeId = parseInt(btn.getAttribute('data-poke-id') || '', 10);
        const entry = roster.find((r) => r.Pokemon?.id === pokeId);
        if (!entry?.Pokemon) return;
        openPokemonDetailModal({
          pokemon: entry.Pokemon,
          mode: 'roster',
          showToast
        });
      });
    });
  };

  const loadCoachRoster = async (coachId: number) => {
    try {
      const data = await api.getCoachRoster(coachId);
      currentShowdownExport = data.showdownExport;
      const rosterPokemons = data.roster.map((r) => r.Pokemon).filter((p): p is NonNullable<typeof p> => Boolean(p));
      const enriched = await enrichPokemonListFromPokeApi(rosterPokemons);
      const enrichedById = new Map(enriched.map((p) => [p.id, p]));
      data.roster = data.roster.map((r) => ({
        ...r,
        Pokemon: r.Pokemon ? enrichedById.get(r.Pokemon.id) || r.Pokemon : r.Pokemon
      }));
      renderRosterDetails(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const loadCoaches = async () => {
    try {
      coaches = await api.getCoaches(leagueId);
      const select = document.getElementById('roster-coach-select') as HTMLSelectElement;
      if (!select) return;

      if (coaches.length === 0) {
        select.innerHTML = '<option value="">Sin entrenadores</option>';
        document.getElementById('roster-main-content')!.innerHTML = `
          <div class="card empty-panel">
            <div class="empty-panel-icon">${icon('user')}</div>
            <h3>No hay entrenadores registrados</h3>
            <p class="subtitle">Inscribe al menos un entrenador en la vista de Ligas para revisar sus plantillas.</p>
          </div>
        `;
        return;
      }

      select.innerHTML = coaches
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.team_name)}</option>`)
        .join('');
      selectedCoachId = coaches[0].id;
      await loadCoachRoster(selectedCoachId);

      select.addEventListener('change', async (e: Event) => {
        selectedCoachId = parseInt((e.target as HTMLSelectElement).value, 10);
        await loadCoachRoster(selectedCoachId);
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  document.getElementById('btn-export-showdown')?.addEventListener('click', () => {
    if (!currentShowdownExport) {
      showToast('No hay datos para exportar.', true);
      return;
    }
    const modalBackdrop = document.getElementById('modal-container');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Exportar a Pokémon Showdown</h2>
          <button type="button" id="btn-close-showdown-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>
        <p class="subtitle" style="margin-bottom: 1rem;">
          Copia y pega este bloque directamente en el Teambuilder de Pokémon Showdown:
        </p>
        <textarea id="showdown-text" class="code-well" readonly aria-label="Código exportable para Pokémon Showdown">${escapeHtml(currentShowdownExport)}</textarea>
        <div class="modal-actions">
          <button type="button" id="btn-close-showdown" class="btn btn-secondary">Cerrar</button>
          <button type="button" id="btn-copy-showdown" class="btn btn-primary">
            ${icon('copy')}
            <span>Copiar al Portapapeles</span>
          </button>
        </div>
      </div>
    `;

    const closeModal = () => modalBackdrop.classList.add('hidden');
    document.getElementById('btn-copy-showdown')?.addEventListener('click', () => {
      navigator.clipboard.writeText(currentShowdownExport);
      showToast('Copiado al portapapeles.');
    });
    document.getElementById('btn-close-showdown')?.addEventListener('click', closeModal);
    document.getElementById('btn-close-showdown-top')?.addEventListener('click', closeModal);
  });

  document.getElementById('btn-free-agency')?.addEventListener('click', async () => {
    if (!selectedCoachId) return;
    try {
      const [rosterData, availablePokemons] = await Promise.all([
        api.getCoachRoster(selectedCoachId),
        api.getPokemons({ leagueId })
      ]);

      const modalBackdrop = document.getElementById('modal-container');
      if (!modalBackdrop) return;
      modalBackdrop.classList.remove('hidden');

      const rosterMap = new Map(rosterData.roster.map((r) => [r.pokemon_id, r.cost_paid]));
      const addMap = new Map(availablePokemons.map((p) => [p.id, p.cost]));

      modalBackdrop.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Mercado de Free Agency</h2>
            <button type="button" id="btn-close-fa-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
              ${icon('close')}
            </button>
          </div>
          <p class="subtitle" style="margin-bottom: 1rem;">
            Suelta un Pokémon de tu plantilla activa e incorpora uno disponible respetando tu límite de puntos.
          </p>
          <form id="form-free-agency" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="field-group">
              <label class="field-label" for="fa-drop-select">Soltar de tu plantilla</label>
              <select id="fa-drop-select" class="select-well">
                ${rosterData.roster
                  .map((r) => `<option value="${r.pokemon_id}">${escapeHtml(r.Pokemon?.name)} (Recuperas ${r.cost_paid} pts)</option>`)
                  .join('')}
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" for="fa-add-select">Fichar Pokémon libre</label>
              <select id="fa-add-select" class="select-well">
                ${availablePokemons
                  .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${p.cost} pts)</option>`)
                  .join('')}
              </select>
            </div>
            <div id="fa-budget-preview" class="neo-well" style="padding: 0.75rem 0.9rem; font-size: 0.86rem;"></div>
            <div class="modal-actions">
              <button type="button" id="btn-cancel-fa" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">${icon('swap')}<span>Confirmar Intercambio</span></button>
            </div>
          </form>
        </div>
      `;

      const updateBudgetPreview = () => {
        const preview = document.getElementById('fa-budget-preview');
        if (!preview) return;
        const dropId = parseInt((document.getElementById('fa-drop-select') as HTMLSelectElement).value, 10);
        const addId = parseInt((document.getElementById('fa-add-select') as HTMLSelectElement).value, 10);
        const refund = rosterMap.get(dropId) || 0;
        const addCost = addMap.get(addId) || 0;
        const projected = rosterData.coach.remaining_budget + refund - addCost;
        const isNegative = projected < 0;
        preview.innerHTML = `Saldo tras el cambio: <strong class="mono-num" style="color: ${isNegative ? 'var(--dex-crimson)' : 'var(--dex-gold)'};">${projected} pts</strong>`;
      };

      updateBudgetPreview();
      document.getElementById('fa-drop-select')?.addEventListener('change', updateBudgetPreview);
      document.getElementById('fa-add-select')?.addEventListener('change', updateBudgetPreview);

      const closeModal = () => modalBackdrop.classList.add('hidden');
      document.getElementById('btn-cancel-fa')?.addEventListener('click', closeModal);
      document.getElementById('btn-close-fa-top')?.addEventListener('click', closeModal);

      document.getElementById('form-free-agency')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dropId = parseInt((document.getElementById('fa-drop-select') as HTMLSelectElement).value, 10);
        const addId = parseInt((document.getElementById('fa-add-select') as HTMLSelectElement).value, 10);
        try {
          await api.freeAgencyDropAdd(selectedCoachId!, dropId, addId);
          showToast('Movimiento de Free Agency completado.');
          closeModal();
          await loadCoachRoster(selectedCoachId!);
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    } catch (e: any) {
      showToast(e.message, true);
    }
  });

  await loadCoaches();
};
