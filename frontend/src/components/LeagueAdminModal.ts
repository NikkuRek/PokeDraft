import { api } from '../services/api.js';
import { ILeague, IPokemon } from '../types/index.js';
import { escapeHtml, formatDexNumber, renderTypeBadge } from '../utils/format.js';
import { icon } from '../utils/icons.js';

export const openLeagueAdminModal = async (
  league: ILeague,
  showToast: (msg: string, isError?: boolean) => void,
  onUpdated?: () => Promise<void> | void
) => {
  const modalBackdrop = document.getElementById('modal-container');
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('hidden');

  const timerPresets = [
    { label: '2 min (En Vivo)', value: 120 },
    { label: '1 hora (Rápido)', value: 3600 },
    { label: '6 horas', value: 21600 },
    { label: '12 horas (Asíncrono)', value: 43200 },
    { label: '24 horas (Diario)', value: 86400 }
  ];

  const currentTimer = league.time_per_pick_seconds || 43200;

  modalBackdrop.innerHTML = `
    <div class="modal-content modal-content--wide">
      <div class="modal-header">
        <div>
          <h2>Comisionado — ${escapeHtml(league.name)}</h2>
          <p class="subtitle" style="margin-top: 0.15rem;">Reglas competitivas, reloj asíncrono y costos/baneos de la liga</p>
        </div>
        <button type="button" id="btn-close-admin-modal" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
          ${icon('close')}
        </button>
      </div>

      <div class="segmented-dock" style="width: 100%; margin-bottom: 1rem;" role="tablist">
        <button type="button" id="btn-admin-tab-rules" class="btn btn-primary btn-sm" style="flex: 1;" role="tab" aria-selected="true">
          ${icon('sliders')}
          <span>Reglas de Liga</span>
        </button>
        <button type="button" id="btn-admin-tab-tiers" class="btn btn-ghost btn-sm" style="flex: 1;" role="tab" aria-selected="false">
          ${icon('ban')}
          <span>Costos y Baneos</span>
        </button>
      </div>

      <div id="admin-pane-rules">
        <form id="form-admin-rules" style="display: flex; flex-direction: column; gap: 0.9rem;">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="admin-format-name">Formato</label>
              <input type="text" id="admin-format-name" class="input-well" value="${escapeHtml(league.format_name || 'NatDex Gen 9')}" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="admin-timer-preset">Ritmo de Pick (Reloj)</label>
              <select id="admin-timer-preset" class="select-well">
                ${timerPresets
                  .map(
                    (p) =>
                      `<option value="${p.value}" ${p.value === currentTimer ? 'selected' : ''}>${p.label}</option>`
                  )
                  .join('')}
                <option value="custom" ${timerPresets.some((p) => p.value === currentTimer) ? '' : 'selected'}>Personalizado (seg)</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="admin-timer-seconds">Segundos por Turno</label>
              <input type="number" id="admin-timer-seconds" class="input-well mono-num" value="${currentTimer}" min="30" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="admin-timeout-action">Al vencer el tiempo</label>
              <select id="admin-timeout-action" class="select-well">
                <option value="AUTO_PICK" ${(league.timeout_action || 'AUTO_PICK') === 'AUTO_PICK' ? 'selected' : ''}>Auto-pick (Cola o menor coste)</option>
                <option value="PAUSE" ${league.timeout_action === 'PAUSE' ? 'selected' : ''}>Pausar Draft</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="admin-max-megas">Máx. Megas por Equipo</label>
              <input type="number" id="admin-max-megas" class="input-well mono-num" value="${league.max_megas ?? 1}" min="0" max="6" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="admin-max-z">Máx. Cristales Z</label>
              <input type="number" id="admin-max-z" class="input-well mono-num" value="${league.max_z_crystals ?? 1}" min="0" max="6" inputmode="numeric" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="admin-max-tera">Máx. Tera Captains</label>
              <input type="number" id="admin-max-tera" class="input-well mono-num" value="${league.max_tera_captains ?? 0}" min="0" max="6" inputmode="numeric" />
            </div>
            <div class="field-group">
              <label class="field-label" for="admin-max-fa">Límite Free Agency (0 = ilimitado)</label>
              <input type="number" id="admin-max-fa" class="input-well mono-num" value="${league.max_free_agency_moves ?? 6}" min="0" max="50" inputmode="numeric" />
            </div>
          </div>

          <div class="rules-toggle-grid">
            <label class="toggle-chip" for="admin-trade-approval">
              <input type="checkbox" id="admin-trade-approval" ${league.require_trade_approval ? 'checked' : ''} />
              <span>Aprobar Trades (Comisionado)</span>
            </label>
            <label class="toggle-chip" for="admin-allow-dynamax">
              <input type="checkbox" id="admin-allow-dynamax" ${league.allow_dynamax ? 'checked' : ''} />
              <span>Permitir Dynamax</span>
            </label>
            <label class="toggle-chip" for="admin-allow-zmoves">
              <input type="checkbox" id="admin-allow-zmoves" ${league.allow_z_moves ? 'checked' : ''} />
              <span>Permitir Z-Moves (No cristal)</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" id="btn-cancel-admin" class="btn btn-secondary">Cerrar</button>
            <button type="submit" class="btn btn-primary">${icon('check')}<span>Guardar Reglas</span></button>
          </div>
        </form>
      </div>

      <div id="admin-pane-tiers" class="hidden">
        <div class="search-field-wrap" style="margin-bottom: 0.75rem;">
          <span class="search-icon">${icon('search')}</span>
          <input
            type="search"
            id="admin-tiers-search"
            class="input-search"
            placeholder="Filtrar Pokémon para ajustar coste o banear..."
            enterkeyhint="search"
            autocapitalize="none"
            autocomplete="off"
          />
        </div>
        <div id="admin-tiers-list" class="tier-editor-list">
          <div class="skeleton-card" style="height: 160px;"></div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => modalBackdrop.classList.add('hidden');
  document.getElementById('btn-close-admin-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-admin')?.addEventListener('click', closeModal);

  const presetSelect = document.getElementById('admin-timer-preset') as HTMLSelectElement | null;
  const secondsInput = document.getElementById('admin-timer-seconds') as HTMLInputElement | null;
  presetSelect?.addEventListener('change', () => {
    if (presetSelect.value !== 'custom' && secondsInput) {
      secondsInput.value = presetSelect.value;
    }
  });

  const tabRules = document.getElementById('btn-admin-tab-rules')!;
  const tabTiers = document.getElementById('btn-admin-tab-tiers')!;
  const paneRules = document.getElementById('admin-pane-rules')!;
  const paneTiers = document.getElementById('admin-pane-tiers')!;

  let catalog: IPokemon[] = [];
  let tiersLoaded = false;

  const renderTiersList = (query = '') => {
    const listEl = document.getElementById('admin-tiers-list');
    if (!listEl) return;

    const clean = query.trim().toLowerCase();
    const filtered = catalog
      .filter((p) => !clean || p.name.toLowerCase().includes(clean) || String(p.dex_number).includes(clean))
      .slice(0, 60);

    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="subtitle" style="text-align:center; padding: 1rem;">No se encontraron especies.</p>`;
      return;
    }

    listEl.innerHTML = filtered
      .map(
        (p) => `
      <div class="neo-well tier-editor-row ${p.is_banned ? 'is-banned' : ''}" data-poke-id="${p.id}">
        <div class="tier-editor-info">
          <span class="dex-number">${formatDexNumber(p.dex_number)}</span>
          <strong class="tier-editor-name">${escapeHtml(p.name)}</strong>
          <div style="display:flex; gap: 0.25rem; flex-wrap:wrap;">
            ${renderTypeBadge(p.type1)}
            ${p.type2 ? renderTypeBadge(p.type2) : ''}
          </div>
        </div>
        <div class="tier-editor-controls">
          <input type="number" class="input-well mono-num tier-cost-input" value="${p.cost}" min="0" max="99" inputmode="numeric" aria-label="Coste para ${escapeHtml(p.name)}" />
          <label class="toggle-chip toggle-chip--compact">
            <input type="checkbox" class="tier-ban-check" ${p.is_banned ? 'checked' : ''} />
            <span>Ban</span>
          </label>
          <button type="button" class="btn btn-primary btn-sm btn-save-tier" data-id="${p.id}">Guardar</button>
        </div>
      </div>
    `
      )
      .join('');
  };

  const loadTiersCatalog = async () => {
    try {
      catalog = await api.getPokemons({ leagueId: league.id, limit: 300 });
      tiersLoaded = true;
      renderTiersList((document.getElementById('admin-tiers-search') as HTMLInputElement)?.value || '');
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  tabRules.addEventListener('click', () => {
    tabRules.className = 'btn btn-primary btn-sm';
    tabTiers.className = 'btn btn-ghost btn-sm';
    paneRules.classList.remove('hidden');
    paneTiers.classList.add('hidden');
  });

  tabTiers.addEventListener('click', async () => {
    tabTiers.className = 'btn btn-primary btn-sm';
    tabRules.className = 'btn btn-ghost btn-sm';
    paneTiers.classList.remove('hidden');
    paneRules.classList.add('hidden');
    if (!tiersLoaded) await loadTiersCatalog();
  });

  let searchTimer: number | undefined;
  document.getElementById('admin-tiers-search')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => renderTiersList(val), 140);
  });

  document.getElementById('admin-tiers-list')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-save-tier');
    if (!btn) return;
    const row = btn.closest<HTMLElement>('.tier-editor-row');
    if (!row) return;
    const pokeId = parseInt(btn.getAttribute('data-id') || '', 10);
    const costInput = row.querySelector<HTMLInputElement>('.tier-cost-input');
    const banCheck = row.querySelector<HTMLInputElement>('.tier-ban-check');
    const customCost = parseInt(costInput?.value || '10', 10) || 0;
    const isBanned = Boolean(banCheck?.checked);

    try {
      await api.setLeaguePokemonTier(league.id, pokeId, customCost, null, isBanned);
      const target = catalog.find((p) => p.id === pokeId);
      if (target) {
        target.cost = customCost;
        target.is_banned = isBanned;
      }
      row.classList.toggle('is-banned', isBanned);
      showToast(`Regla actualizada (${customCost} pts${isBanned ? ' · BANEADO' : ''}).`);
      if (onUpdated) await onUpdated();
    } catch (err: any) {
      showToast(err.message, true);
    }
  });

  document.getElementById('form-admin-rules')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.updateLeagueRules(league.id, {
        format_name: (document.getElementById('admin-format-name') as HTMLInputElement).value.trim(),
        time_per_pick_seconds: parseInt(
          (document.getElementById('admin-timer-seconds') as HTMLInputElement).value,
          10
        ),
        timeout_action: (document.getElementById('admin-timeout-action') as HTMLSelectElement).value as
          | 'AUTO_PICK'
          | 'PAUSE',
        max_megas: parseInt((document.getElementById('admin-max-megas') as HTMLInputElement).value, 10),
        max_z_crystals: parseInt((document.getElementById('admin-max-z') as HTMLInputElement).value, 10),
        max_tera_captains: parseInt((document.getElementById('admin-max-tera') as HTMLInputElement).value, 10),
        max_free_agency_moves: parseInt((document.getElementById('admin-max-fa') as HTMLInputElement).value, 10),
        require_trade_approval: Boolean(
          (document.getElementById('admin-trade-approval') as HTMLInputElement).checked
        ),
        allow_dynamax: Boolean((document.getElementById('admin-allow-dynamax') as HTMLInputElement).checked),
        allow_z_moves: Boolean((document.getElementById('admin-allow-zmoves') as HTMLInputElement).checked)
      });
      showToast('Reglas de liga guardadas correctamente.');
      closeModal();
      if (onUpdated) await onUpdated();
    } catch (err: any) {
      showToast(err.message, true);
    }
  });
};
