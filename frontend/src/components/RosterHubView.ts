import { api } from '../services/api.js';
import { enrichPokemonListFromPokeApi } from '../services/pokeapi.js';
import { ICoach, ILeague, IRosterEntry, ITrade, ITransaction } from '../types/index.js';
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
        <p class="subtitle">Por favor selecciona una liga en el menú superior para inspeccionar plantillas, trades e historial.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">${icon('rosters')}<span>Plantillas, Trades & Movimientos</span></h1>
        <p class="subtitle">Gestiona Mega Evolución, Cristal Z, intercambios entre equipos y cobertura defensiva de 18 tipos</p>
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

    <div class="segmented-dock" style="margin-bottom: 1.1rem; width: 100%; max-width: 520px;" role="tablist" aria-label="Sub-secciones de plantillas">
      <button type="button" id="btn-subtab-roster" class="btn btn-primary btn-sm" style="flex:1;" role="tab" aria-selected="true">
        ${icon('rosters')}<span>Plantilla</span>
      </button>
      <button type="button" id="btn-subtab-trades" class="btn btn-ghost btn-sm" style="flex:1;" role="tab" aria-selected="false">
        ${icon('swap')}<span>Trades</span>
      </button>
      <button type="button" id="btn-subtab-log" class="btn btn-ghost btn-sm" style="flex:1;" role="tab" aria-selected="false">
        ${icon('clock')}<span>Historial</span>
      </button>
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
  let currentRoster: IRosterEntry[] = [];
  let currentLeague: ILeague | undefined;
  let currentFaUsed = 0;
  let activeSubtab: 'roster' | 'trades' | 'log' = 'roster';

  const getTradeStatusBadge = (status: ITrade['status']) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', cls: 'status-setup' };
      case 'AWAITING_APPROVAL':
        return { label: 'Esperando Comisionado', cls: 'status-drafting' };
      case 'ACCEPTED':
        return { label: 'Completado', cls: 'status-active' };
      case 'REJECTED':
        return { label: 'Rechazado', cls: 'status-finished' };
      case 'CANCELLED':
        return { label: 'Cancelado', cls: 'status-finished' };
    }
  };

  const renderRosterDetails = (data: {
    coach: ICoach;
    roster: IRosterEntry[];
    coverage: any;
    league?: ILeague;
    free_agency_used?: number;
  }) => {
    const mainContent = document.getElementById('roster-main-content');
    if (!mainContent || activeSubtab !== 'roster') return;

    const { coach, roster, coverage, league, free_agency_used = 0 } = data;
    currentRoster = roster;
    currentLeague = league;
    currentFaUsed = free_agency_used;

    const validRoster = roster.filter((r) => Boolean(r.Pokemon));
    const avgBst =
      validRoster.length > 0
        ? Math.round(validRoster.reduce((acc, r) => acc + (r.Pokemon?.base_bst || 0), 0) / validRoster.length)
        : 0;

    const megaCount = roster.filter((r) => r.is_mega).length;
    const zCount = roster.filter((r) => r.is_z_user).length;
    const teraCount = roster.filter((r) => r.is_tera_captain).length;
    const maxMegas = league?.max_megas ?? 1;
    const maxZ = league?.max_z_crystals ?? 1;
    const maxTera = league?.max_tera_captains ?? 0;
    const maxFa = league?.max_free_agency_moves ?? 6;

    mainContent.innerHTML = `
      <div class="roster-summary-deck">
        <div class="neo-well summary-well">
          <span class="summary-well-label">Entrenador / Franquicia</span>
          <span class="summary-well-value">${escapeHtml(coach.name)} · ${escapeHtml(coach.team_name)}</span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">Cupos Especiales</span>
          <span class="summary-well-value mono-num" style="font-size: 0.94rem;">
            Mega ${megaCount}/${maxMegas} · Z ${zCount}/${maxZ}${maxTera > 0 ? ` · Tera ${teraCount}/${maxTera}` : ''}
          </span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">Presupuesto Restante</span>
          <span class="summary-well-value mono-num" style="color: var(--dex-gold);">${coach.remaining_budget} pts</span>
        </div>
        <div class="neo-well summary-well">
          <span class="summary-well-label">Free Agency · BST Prom.</span>
          <span class="summary-well-value mono-num" style="color: var(--dex-cyan); font-size: 0.96rem;">
            ${maxFa === 0 ? `${free_agency_used}/∞` : `${free_agency_used}/${maxFa}`} · ${avgBst}
          </span>
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
              .map((entry, idx) => {
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
                      <div style="display: flex; align-items: center; gap: 0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                        ${entry.is_mega ? '<span class="mega-pill">MEGA</span>' : ''}
                        ${entry.is_z_user ? '<span class="z-pill">CRISTAL Z</span>' : ''}
                        ${entry.is_tera_captain ? '<span class="tera-pill">TERA</span>' : ''}
                        <span class="pokemon-cost-badge">${entry.cost_paid} pts</span>
                      </div>
                    </div>

                    <div class="roster-sprite-stage">
                      <div class="poke-slot-well">${renderPokemonSprite(p, 'pokemon-sprite', false, { eager: idx < 4 })}</div>
                      <button type="button" class="pokemon-name-btn btn-roster-inspect" data-poke-id="${p.id}" title="Ver ficha Pokédex de ${escapeHtml(p.name)}">
                        <span>${escapeHtml(p.name)}</span>
                      </button>
                      <div class="pokemon-types-row" style="margin-bottom: 0.25rem;">
                        ${renderTypeBadge(p.type1)}
                        ${p.type2 ? renderTypeBadge(p.type2) : ''}
                      </div>
                    </div>

                    <div class="designation-bar" aria-label="Designaciones competitivas">
                      <button
                        type="button"
                        class="btn btn-sm ${entry.is_mega ? 'btn-primary' : 'btn-secondary'} btn-toggle-desig"
                        data-entry-id="${entry.id}"
                        data-field="is_mega"
                        data-next="${!entry.is_mega}"
                      >
                        Mega
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm ${entry.is_z_user ? 'btn-primary' : 'btn-secondary'} btn-toggle-desig"
                        data-entry-id="${entry.id}"
                        data-field="is_z_user"
                        data-next="${!entry.is_z_user}"
                      >
                        Cristal Z
                      </button>
                      ${
                        maxTera > 0
                          ? `
                        <button
                          type="button"
                          class="btn btn-sm ${entry.is_tera_captain ? 'btn-primary' : 'btn-secondary'} btn-toggle-desig"
                          data-entry-id="${entry.id}"
                          data-field="is_tera_captain"
                          data-next="${!entry.is_tera_captain}"
                        >
                          Tera
                        </button>
                      `
                          : ''
                      }
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
          Cantidad de Pokémon de la plantilla que resisten, son inmunes o son débiles ante cada tipo atacante.
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
  };

  const openProposeTradeModal = async () => {
    if (!selectedCoachId || coaches.length < 2) {
      showToast('Se requieren al menos 2 entrenadores para proponer un trade.', true);
      return;
    }

    const otherCoaches = coaches.filter((c) => c.id !== selectedCoachId);
    let receiverCoachId = otherCoaches[0].id;

    try {
      const [proposerData, receiverInitialData] = await Promise.all([
        api.getCoachRoster(selectedCoachId),
        api.getCoachRoster(receiverCoachId)
      ]);

      let receiverRoster = receiverInitialData.roster;
      let receiverBudget = receiverInitialData.coach.remaining_budget;
      const proposerBudget = proposerData.coach.remaining_budget;

      const modalBackdrop = document.getElementById('modal-container');
      if (!modalBackdrop) return;
      modalBackdrop.classList.remove('hidden');

      const renderChecklist = (entries: IRosterEntry[], cls: string) => {
        if (entries.length === 0) return '<p class="subtitle">Sin Pokémon en plantilla.</p>';
        return entries
          .map(
            (e) => `
          <label class="neo-well trade-pick-row">
            <input type="checkbox" class="${cls}" value="${e.pokemon_id}" data-cost="${e.cost_paid}" />
            <div class="mini-socket">${e.Pokemon ? renderPokemonSprite(e.Pokemon, 'mini-sprite', false, { size: 30 }) : ''}</div>
            <span style="flex:1; font-weight:600; font-size:0.84rem;">${escapeHtml(e.Pokemon?.name || '')}</span>
            <span class="pokemon-cost-badge">${e.cost_paid} pts</span>
          </label>
        `
          )
          .join('');
      };

      modalBackdrop.innerHTML = `
        <div class="modal-content modal-content--wide">
          <div class="modal-header">
            <h2>Proponer Trade (1×1 o N×M)</h2>
            <button type="button" id="btn-close-trade-modal" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">${icon('close')}</button>
          </div>
          <form id="form-propose-trade" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="field-group">
              <label class="field-label" for="trade-receiver-select">Intercambiar con:</label>
              <select id="trade-receiver-select" class="select-well">
                ${otherCoaches.map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(c.team_name)}</option>`).join('')}
              </select>
            </div>

            <div class="trade-columns">
              <div>
                <div class="field-label" style="margin-bottom:0.45rem;">Envía ${escapeHtml(proposerData.coach.name)}</div>
                <div id="trade-proposer-list" class="trade-pick-list">${renderChecklist(proposerData.roster, 'trade-prop-check')}</div>
              </div>
              <div>
                <div class="field-label" style="margin-bottom:0.45rem;">Envía el Receptor</div>
                <div id="trade-receiver-list" class="trade-pick-list">${renderChecklist(receiverRoster, 'trade-recv-check')}</div>
              </div>
            </div>

            <div id="trade-budget-preview" class="neo-well" style="padding:0.7rem 0.85rem; font-size:0.82rem; color:var(--ink-secondary);">
              Selecciona al menos un Pokémon de cada lado para validar presupuestos.
            </div>

            <div class="field-group">
              <label class="field-label" for="trade-notes">Nota (opcional)</label>
              <input type="text" id="trade-notes" class="input-well" placeholder="Ej. Ajuste de velocidad y cobertura" />
            </div>

            <div class="modal-actions">
              <button type="button" id="btn-cancel-trade-modal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">${icon('swap')}<span>Enviar Propuesta</span></button>
            </div>
          </form>
        </div>
      `;

      const closeModal = () => modalBackdrop.classList.add('hidden');
      document.getElementById('btn-close-trade-modal')?.addEventListener('click', closeModal);
      document.getElementById('btn-cancel-trade-modal')?.addEventListener('click', closeModal);

      const updateTradePreview = () => {
        const preview = document.getElementById('trade-budget-preview');
        if (!preview) return;
        let sumProp = 0;
        let sumRecv = 0;
        modalBackdrop.querySelectorAll<HTMLInputElement>('.trade-prop-check:checked').forEach((el) => {
          sumProp += parseInt(el.getAttribute('data-cost') || '0', 10);
        });
        modalBackdrop.querySelectorAll<HTMLInputElement>('.trade-recv-check:checked').forEach((el) => {
          sumRecv += parseInt(el.getAttribute('data-cost') || '0', 10);
        });
        const nextProp = proposerBudget + sumProp - sumRecv;
        const nextRecv = receiverBudget + sumRecv - sumProp;
        preview.innerHTML = `Saldo tras trade — ${escapeHtml(proposerData.coach.name)}: <strong class="mono-num" style="color:${nextProp < 0 ? 'var(--dex-crimson)' : 'var(--dex-gold)'};">${nextProp} pts</strong> · Receptor: <strong class="mono-num" style="color:${nextRecv < 0 ? 'var(--dex-crimson)' : 'var(--dex-gold)'};">${nextRecv} pts</strong>`;
      };

      modalBackdrop.addEventListener('change', (ev) => {
        const target = ev.target as HTMLElement;
        if (target.classList.contains('trade-prop-check') || target.classList.contains('trade-recv-check')) {
          updateTradePreview();
        }
      });

      document.getElementById('trade-receiver-select')?.addEventListener('change', async (e) => {
        receiverCoachId = parseInt((e.target as HTMLSelectElement).value, 10);
        const nextData = await api.getCoachRoster(receiverCoachId);
        receiverRoster = nextData.roster;
        receiverBudget = nextData.coach.remaining_budget;
        const recvEl = document.getElementById('trade-receiver-list');
        if (recvEl) recvEl.innerHTML = renderChecklist(receiverRoster, 'trade-recv-check');
        updateTradePreview();
      });

      document.getElementById('form-propose-trade')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const propIds: number[] = [];
        const recvIds: number[] = [];
        modalBackdrop.querySelectorAll<HTMLInputElement>('.trade-prop-check:checked').forEach((el) => {
          propIds.push(parseInt(el.value, 10));
        });
        modalBackdrop.querySelectorAll<HTMLInputElement>('.trade-recv-check:checked').forEach((el) => {
          recvIds.push(parseInt(el.value, 10));
        });

        try {
          await api.proposeTrade(leagueId, {
            proposer_coach_id: selectedCoachId!,
            receiver_coach_id: receiverCoachId,
            proposer_pokemon_ids: propIds,
            receiver_pokemon_ids: recvIds,
            notes: (document.getElementById('trade-notes') as HTMLInputElement).value.trim() || undefined
          });
          showToast('Propuesta de intercambio enviada.');
          closeModal();
          await loadTradesView();
        } catch (err: any) {
          showToast(err.message, true);
        }
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const loadTradesView = async () => {
    const mainContent = document.getElementById('roster-main-content');
    if (!mainContent || activeSubtab !== 'trades') return;

    try {
      const trades = await api.getLeagueTrades(leagueId);
      const authUser = api.getAuthUser();
      const canCommissionerApprove = Boolean(
        authUser && (authUser.role === 'ADMIN' || currentLeague?.admin_id === authUser.id)
      );

      mainContent.innerHTML = `
        <div class="card" style="margin-bottom: 1rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <div>
            <h2 style="font-size:1.1rem;">Centro de Intercambios (Trades)</h2>
            <p class="subtitle" style="margin-top:0.15rem;">Propuestas 1×1 o N×M con validación automática de presupuesto, Mega Evoluciones y Cristales Z.</p>
          </div>
          <button type="button" id="btn-open-propose-trade" class="btn btn-primary btn-sm">
            ${icon('swap')}<span>Proponer Trade</span>
          </button>
        </div>

        <div id="trades-list-container" style="display:flex; flex-direction:column; gap:0.85rem;">
          ${
            trades.length === 0
              ? `<div class="card empty-panel"><div class="empty-panel-icon">${icon('swap')}</div><h3>No hay trades todavía</h3><p class="subtitle">Usa "Proponer Trade" para enviar la primera oferta de intercambio.</p></div>`
              : trades
                  .map((tr) => {
                    const badge = getTradeStatusBadge(tr.status);
                    const fromProp = (tr.Items || []).filter((i) => i.from_coach_id === tr.proposer_coach_id);
                    const fromRecv = (tr.Items || []).filter((i) => i.from_coach_id === tr.receiver_coach_id);

                    const renderSide = (items: typeof fromProp) =>
                      items
                        .map(
                          (it) => `
                      <div class="trade-chip">
                        <div class="mini-socket">${it.Pokemon ? renderPokemonSprite(it.Pokemon, 'mini-sprite', false, { size: 28 }) : ''}</div>
                        <span>${escapeHtml(it.Pokemon?.name || `#${it.pokemon_id}`)}</span>
                        <span class="mono-num" style="color:var(--dex-gold); font-size:0.72rem;">${it.cost_paid}p</span>
                      </div>
                    `
                        )
                        .join('');

                    return `
                      <article class="card trade-card">
                        <div class="league-card-head">
                          <div>
                            <strong>${escapeHtml(tr.ProposerCoach?.name || '')} ↔ ${escapeHtml(tr.ReceiverCoach?.name || '')}</strong>
                            ${tr.notes ? `<div class="subtitle" style="font-size:0.8rem; margin-top:0.15rem;">${escapeHtml(tr.notes)}</div>` : ''}
                          </div>
                          <span class="status-pill ${badge.cls}"><span class="status-dot"></span><span>${badge.label}</span></span>
                        </div>

                        <div class="trade-columns">
                          <div class="neo-well" style="padding:0.65rem;">
                            <div class="field-label" style="margin-bottom:0.4rem;">De ${escapeHtml(tr.ProposerCoach?.name || '')}</div>
                            <div class="abilities-row">${renderSide(fromProp)}</div>
                          </div>
                          <div class="neo-well" style="padding:0.65rem;">
                            <div class="field-label" style="margin-bottom:0.4rem;">De ${escapeHtml(tr.ReceiverCoach?.name || '')}</div>
                            <div class="abilities-row">${renderSide(fromRecv)}</div>
                          </div>
                        </div>

                        <div class="modal-actions" style="margin-top:0.25rem;">
                          ${
                            tr.status === 'PENDING'
                              ? `
                            <button type="button" class="btn btn-secondary btn-sm btn-trade-respond" data-id="${tr.id}" data-action="CANCEL">Cancelar</button>
                            <button type="button" class="btn btn-danger btn-sm btn-trade-respond" data-id="${tr.id}" data-action="REJECT">Rechazar</button>
                            <button type="button" class="btn btn-primary btn-sm btn-trade-respond" data-id="${tr.id}" data-action="ACCEPT">Aceptar</button>
                          `
                              : ''
                          }
                          ${
                            tr.status === 'AWAITING_APPROVAL' && canCommissionerApprove
                              ? `
                            <button type="button" class="btn btn-danger btn-sm btn-trade-review" data-id="${tr.id}" data-approve="false">Vetar Trade</button>
                            <button type="button" class="btn btn-primary btn-sm btn-trade-review" data-id="${tr.id}" data-approve="true">${icon('crown')}<span>Aprobar Trade</span></button>
                          `
                              : ''
                          }
                        </div>
                      </article>
                    `;
                  })
                  .join('')
          }
        </div>
      `;

      document.getElementById('btn-open-propose-trade')?.addEventListener('click', openProposeTradeModal);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const loadTransactionLogView = async () => {
    const mainContent = document.getElementById('roster-main-content');
    if (!mainContent || activeSubtab !== 'log') return;

    try {
      const transactions: ITransaction[] = await api.getLeagueTransactions(leagueId);
      mainContent.innerHTML = `
        <div class="card">
          <h2 class="panel-heading">
            <span class="panel-heading-left">${icon('clock')}<span>Historial Público de Movimientos</span></span>
            <span class="mono-num" style="font-size:0.78rem; color:var(--ink-muted);">${transactions.length} registros</span>
          </h2>
          ${
            transactions.length === 0
              ? `<div class="empty-panel" style="padding:2rem 1rem;"><div class="empty-panel-icon">${icon('clock')}</div><h3>Sin movimientos aún</h3><p class="subtitle">Los cambios en Free Agency e intercambios completados aparecerán aquí.</p></div>`
              : `
            <div style="display:flex; flex-direction:column; gap:0.55rem;">
              ${transactions
                .map((tx) => {
                  const dateLabel = new Date(tx.created_at).toLocaleString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return `
                  <div class="neo-well tx-row">
                    <span class="status-pill ${tx.type === 'TRADE' ? 'status-drafting' : 'status-active'}">
                      <span>${tx.type === 'TRADE' ? 'Trade' : 'Free Agency'}</span>
                    </span>
                    <div style="flex:1; min-width:0;">
                      <div style="font-weight:700; font-size:0.86rem;">
                        ${escapeHtml(tx.Coach?.name || '')}${tx.CounterpartyCoach ? ` ↔ ${escapeHtml(tx.CounterpartyCoach.name)}` : ''}
                      </div>
                      <div style="font-size:0.78rem; color:var(--ink-secondary);">
                        ${
                          tx.type === 'FREE_AGENCY'
                            ? `Suelta <strong>${escapeHtml(tx.DropPokemon?.name || '')}</strong> · Ficha <strong style="color:#6ee7b7;">${escapeHtml(tx.AddPokemon?.name || '')}</strong>`
                            : escapeHtml(tx.notes || 'Intercambio completado')
                        }
                      </div>
                    </div>
                    <span class="mono-num" style="font-size:0.7rem; color:var(--ink-muted);">${escapeHtml(dateLabel)}</span>
                  </div>
                `;
                })
                .join('')}
            </div>
          `
          }
        </div>
      `;
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Single delegated listener on #roster-main-content
  document.getElementById('roster-main-content')?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const inspectBtn = target.closest<HTMLElement>('.btn-roster-inspect');
    if (inspectBtn) {
      const pokeId = parseInt(inspectBtn.getAttribute('data-poke-id') || '', 10);
      const entry = currentRoster.find((r) => r.Pokemon?.id === pokeId);
      if (!entry?.Pokemon) return;
      openPokemonDetailModal({
        pokemon: entry.Pokemon,
        mode: 'roster',
        showToast
      });
      return;
    }

    const desigBtn = target.closest<HTMLButtonElement>('.btn-toggle-desig');
    if (desigBtn && selectedCoachId) {
      const entryId = parseInt(desigBtn.getAttribute('data-entry-id') || '', 10);
      const field = desigBtn.getAttribute('data-field') as 'is_mega' | 'is_z_user' | 'is_tera_captain';
      const nextVal = desigBtn.getAttribute('data-next') === 'true';
      try {
        await api.updateRosterDesignations(selectedCoachId, entryId, { [field]: nextVal });
        showToast('Designación actualizada.');
        await loadCoachRoster(selectedCoachId);
      } catch (err: any) {
        showToast(err.message, true);
      }
      return;
    }

    const respondBtn = target.closest<HTMLButtonElement>('.btn-trade-respond');
    if (respondBtn) {
      const tradeId = parseInt(respondBtn.getAttribute('data-id') || '', 10);
      const action = respondBtn.getAttribute('data-action') as 'ACCEPT' | 'REJECT' | 'CANCEL';
      try {
        await api.respondToTrade(tradeId, action);
        showToast(action === 'ACCEPT' ? 'Intercambio procesado.' : 'Intercambio actualizado.');
        await loadTradesView();
      } catch (err: any) {
        showToast(err.message, true);
      }
      return;
    }

    const reviewBtn = target.closest<HTMLButtonElement>('.btn-trade-review');
    if (reviewBtn) {
      const tradeId = parseInt(reviewBtn.getAttribute('data-id') || '', 10);
      const approve = reviewBtn.getAttribute('data-approve') === 'true';
      try {
        await api.reviewTrade(leagueId, tradeId, approve);
        showToast(approve ? 'Trade aprobado y ejecutado.' : 'Trade vetado.');
        await loadTradesView();
      } catch (err: any) {
        showToast(err.message, true);
      }
    }
  });

  const loadCoachRoster = async (coachId: number) => {
    try {
      const data = await api.getCoachRoster(coachId);
      currentShowdownExport = data.showdownExport;
      currentLeague = data.league;
      currentFaUsed = data.free_agency_used ?? 0;
      const rosterPokemons = data.roster.map((r) => r.Pokemon).filter((p): p is NonNullable<typeof p> => Boolean(p));
      const enriched = await enrichPokemonListFromPokeApi(rosterPokemons);
      const enrichedById = new Map(enriched.map((p) => [p.id, p]));
      data.roster = data.roster.map((r) => ({
        ...r,
        Pokemon: r.Pokemon ? enrichedById.get(r.Pokemon.id) || r.Pokemon : r.Pokemon
      }));
      if (activeSubtab === 'roster') {
        renderRosterDetails(data);
      }
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

      const authUser = api.getAuthUser();
      const myCoach = authUser ? coaches.find((c) => c.user_id === authUser.id) : undefined;
      selectedCoachId = myCoach?.id || coaches[0].id;

      select.innerHTML = coaches
        .map(
          (c) =>
            `<option value="${c.id}" ${c.id === selectedCoachId ? 'selected' : ''}>${escapeHtml(c.name)} — ${escapeHtml(c.team_name)}</option>`
        )
        .join('');

      await loadCoachRoster(selectedCoachId);

      select.addEventListener('change', async (e: Event) => {
        selectedCoachId = parseInt((e.target as HTMLSelectElement).value, 10);
        if (activeSubtab === 'roster') {
          await loadCoachRoster(selectedCoachId);
        }
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const tabRoster = document.getElementById('btn-subtab-roster')!;
  const tabTrades = document.getElementById('btn-subtab-trades')!;
  const tabLog = document.getElementById('btn-subtab-log')!;

  const syncSubtabClasses = () => {
    tabRoster.className = activeSubtab === 'roster' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    tabTrades.className = activeSubtab === 'trades' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    tabLog.className = activeSubtab === 'log' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
  };

  tabRoster.addEventListener('click', async () => {
    activeSubtab = 'roster';
    syncSubtabClasses();
    if (selectedCoachId) await loadCoachRoster(selectedCoachId);
  });

  tabTrades.addEventListener('click', async () => {
    activeSubtab = 'trades';
    syncSubtabClasses();
    await loadTradesView();
  });

  tabLog.addEventListener('click', async () => {
    activeSubtab = 'log';
    syncSubtabClasses();
    await loadTransactionLogView();
  });

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
      const nonBanned = availablePokemons.filter((p) => !p.is_banned);
      const addMap = new Map(nonBanned.map((p) => [p.id, p.cost]));
      const maxFa = rosterData.league?.max_free_agency_moves ?? 6;
      const usedFa = rosterData.free_agency_used ?? currentFaUsed;

      modalBackdrop.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Mercado de Free Agency</h2>
            <button type="button" id="btn-close-fa-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
              ${icon('close')}
            </button>
          </div>
          <p class="subtitle" style="margin-bottom: 1rem;">
            Movimientos usados: <strong class="mono-num">${maxFa === 0 ? `${usedFa} / Ilimitado` : `${usedFa} / ${maxFa}`}</strong>. Respeta presupuesto, baneos y límite de Megas.
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
                ${nonBanned
                  .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}${p.is_mega ? ' [Mega]' : ''} (${p.cost} pts)</option>`)
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
          activeSubtab = 'roster';
          syncSubtabClasses();
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
