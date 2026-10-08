import { api } from '../services/api.js';
import { ICoach, IRosterEntry } from '../types/index.js';

export const renderRosterHubView = async (
  container: HTMLElement,
  leagueId: number | null,
  showToast: (msg: string, isError?: boolean) => void
) => {
  if (!leagueId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 4rem;">
        <h2>Selecciona una Liga</h2>
        <p style="color: var(--text-muted); margin: 1rem 0;">Por favor selecciona una liga para ver las plantillas y coberturas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Plantillas & Coberturas de Equipo</h1>
        <p class="subtitle">Analiza las debilidades elementales y exporta a Pokémon Showdown</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <select id="roster-coach-select" class="select-input"></select>
        <button id="btn-export-showdown" class="btn btn-secondary">📋 Exportar Showdown</button>
        <button id="btn-free-agency" class="btn btn-primary">🔄 Free Agency</button>
      </div>
    </div>

    <div id="roster-main-content">
      <div class="card" style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">Cargando plantilla...</p>
      </div>
    </div>
  `;

  let coaches: ICoach[] = [];
  let selectedCoachId: number | null = null;
  let currentShowdownExport = '';

  const loadCoaches = async () => {
    try {
      coaches = await api.getCoaches(leagueId);
      const select = document.getElementById('roster-coach-select') as HTMLSelectElement;
      if (!select) return;

      if (coaches.length === 0) {
        document.getElementById('roster-main-content')!.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem;">
            <h3>No hay entrenadores registrados en esta liga.</h3>
          </div>
        `;
        return;
      }

      select.innerHTML = coaches.map((c) => `<option value="${c.id}">${c.name} - ${c.team_name}</option>`).join('');
      selectedCoachId = coaches[0].id;
      await loadCoachRoster(selectedCoachId);

      select.addEventListener('change', async (e: any) => {
        selectedCoachId = parseInt(e.target.value, 10);
        await loadCoachRoster(selectedCoachId);
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const loadCoachRoster = async (coachId: number) => {
    try {
      const data = await api.getCoachRoster(coachId);
      currentShowdownExport = data.showdownExport;
      renderRosterDetails(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const renderRosterDetails = (data: { coach: ICoach; roster: IRosterEntry[]; coverage: any }) => {
    const mainContent = document.getElementById('roster-main-content');
    if (!mainContent) return;

    const { coach, roster, coverage } = data;

    mainContent.innerHTML = `
      <!-- Roster Pokemon Cards -->
      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">🛡️ Plantilla Activa (${roster.length} Pokémon) - Presupuesto Restante: <span style="color: var(--accent-gold);">${coach.remaining_budget} pts</span></h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
          ${roster.length === 0 ? '<p style="color: var(--text-muted);">No hay Pokémon en la plantilla todavía.</p>' : ''}
          ${roster
            .map((entry) => {
              const p = entry.Pokemon;
              if (!p) return '';
              return `
                <div class="card" style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative;">
                  <span class="pokemon-cost-badge">${entry.cost_paid} pts</span>
                  <img src="${p.sprite_animated_url || p.sprite_url}" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 0.5rem;" />
                  <div style="font-weight: 700;">${p.name}</div>
                  <div style="margin: 0.25rem 0;">
                    <span class="type-badge type-${p.type1.toLowerCase()}">${p.type1}</span>
                    ${p.type2 ? `<span class="type-badge type-${p.type2.toLowerCase()}">${p.type2}</span>` : ''}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 100%;">
                    <div>HP: ${p.base_hp}</div>
                    <div>ATK: ${p.base_atk}</div>
                    <div>DEF: ${p.base_def}</div>
                    <div>SPA: ${p.base_spa}</div>
                    <div>SPD: ${p.base_spd}</div>
                    <div>SPE: ${p.base_spe}</div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Elemental Defensive Coverage Matrix -->
      <div class="card">
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">📊 Matriz de Coberturas Defensivas</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Cantidad de Pokémon de la plantilla que resisten, son inmunes o débiles a cada tipo elemental atacante.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem;">
          ${Object.entries(coverage)
            .map(([type, stats]: [string, any]) => `
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.5rem; text-align: center;">
                <span class="type-badge type-${type}" style="width: 100%; display: block; margin-bottom: 0.4rem;">${type}</span>
                <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--accent-green);">🛡️ Resiste: ${stats.resist}</span>
                  <span style="color: var(--accent-primary);">✨ Inmune: ${stats.immune}</span>
                  <span style="color: var(--accent-red);">⚠️ Débil: ${stats.weak}</span>
                </div>
              </div>
            `)
            .join('')}
        </div>
      </div>
    `;
  };

  // Export to Showdown modal
  document.getElementById('btn-export-showdown')?.addEventListener('click', () => {
    if (!currentShowdownExport) {
      showToast('No hay datos para exportar.', true);
      return;
    }
    const modalBackdrop = document.getElementById('modal-container')!;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <h2>Exportar a Pokémon Showdown</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.5rem 0 1rem;">
          Copia y pega este texto directamente en el Teambuilder de Pokémon Showdown:
        </p>
        <textarea id="showdown-text" class="input-search" style="width: 100%; height: 260px; font-family: monospace; font-size: 0.85rem;" readonly>${currentShowdownExport}</textarea>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button id="btn-copy-showdown" class="btn btn-primary">📋 Copiar al Portapapeles</button>
          <button id="btn-close-showdown" class="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    `;

    document.getElementById('btn-copy-showdown')?.addEventListener('click', () => {
      navigator.clipboard.writeText(currentShowdownExport);
      showToast('¡Copiado al portapapeles!');
    });

    document.getElementById('btn-close-showdown')?.addEventListener('click', () => {
      modalBackdrop.classList.add('hidden');
    });
  });

  // Free Agency Drop/Add modal
  document.getElementById('btn-free-agency')?.addEventListener('click', async () => {
    if (!selectedCoachId) return;
    try {
      const rosterData = await api.getCoachRoster(selectedCoachId);
      const availablePokemons = await api.getPokemons({ leagueId });

      const modalBackdrop = document.getElementById('modal-container')!;
      modalBackdrop.classList.remove('hidden');
      modalBackdrop.innerHTML = `
        <div class="modal-content">
          <h2>Mercado de Free Agency</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
            Suelta un Pokémon de tu plantilla e incorpora uno libre respetando el límite de puntos.
          </p>
          <form id="form-free-agency" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Soltar de tu plantilla:</label>
              <select id="fa-drop-select" class="select-input" style="width: 100%;">
                ${rosterData.roster.map((r) => `<option value="${r.pokemon_id}">${r.Pokemon?.name} (Recuperas ${r.cost_paid} pts)</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text-muted);">Fichar Pokémon Libre:</label>
              <select id="fa-add-select" class="select-input" style="width: 100%;">
                ${availablePokemons.map((p) => `<option value="${p.id}">${p.name} (${p.cost} pts)</option>`).join('')}
              </select>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
              <button type="button" id="btn-cancel-fa" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Confirmar Intercambio</button>
            </div>
          </form>
        </div>
      `;

      document.getElementById('btn-cancel-fa')?.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
      });

      document.getElementById('form-free-agency')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dropId = parseInt((document.getElementById('fa-drop-select') as HTMLSelectElement).value, 10);
        const addId = parseInt((document.getElementById('fa-add-select') as HTMLSelectElement).value, 10);
        try {
          await api.freeAgencyDropAdd(selectedCoachId!, dropId, addId);
          showToast('¡Movimiento de Free Agency completado!');
          modalBackdrop.classList.add('hidden');
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
