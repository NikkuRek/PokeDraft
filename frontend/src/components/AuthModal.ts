import { api } from '../services/api.js';
import { icon } from '../utils/icons.js';

export const renderAuthModal = (
  onSuccess: () => void,
  showToast: (msg: string, isError?: boolean) => void
) => {
  const modalBackdrop = document.getElementById('modal-container');
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('hidden');

  const closeModal = () => modalBackdrop.classList.add('hidden');
  const token = api.getToken();

  if (token) {
    modalBackdrop.innerHTML = `
      <div class="modal-content modal-content--compact">
        <div class="modal-header">
          <h2>Mi Cuenta</h2>
          <button type="button" id="btn-close-auth-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
            ${icon('close')}
          </button>
        </div>

        <div class="neo-well" style="padding: 1rem; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; border-color: var(--dex-emerald-border);">
          <span class="auth-led is-online" aria-hidden="true"></span>
          <div>
            <div style="font-weight: 700; color: var(--ink-primary);">Sesión JWT activa</div>
            <div style="font-size: 0.8rem; color: var(--ink-secondary);">Autorizado para operar ligas y picks en tu cuenta.</div>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 0;">
          <button type="button" id="btn-close-auth" class="btn btn-secondary">Cerrar</button>
          <button type="button" id="btn-logout" class="btn btn-danger">
            ${icon('logout')}
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      api.setToken(null);
      showToast('Sesión cerrada.');
      closeModal();
      onSuccess();
    });

    document.getElementById('btn-close-auth')?.addEventListener('click', closeModal);
    document.getElementById('btn-close-auth-top')?.addEventListener('click', closeModal);
    return;
  }

  modalBackdrop.innerHTML = `
    <div class="modal-content modal-content--compact">
      <div class="modal-header">
        <h2>Acceso de Entrenador</h2>
        <button type="button" id="btn-close-auth-top" class="btn btn-ghost btn-icon" aria-label="Cerrar ventana">
          ${icon('close')}
        </button>
      </div>

      <div class="segmented-dock" style="width: 100%; margin-bottom: 1.25rem;">
        <button type="button" id="btn-tab-login" class="btn btn-primary btn-sm" style="flex: 1;">Iniciar Sesión</button>
        <button type="button" id="btn-tab-register" class="btn btn-ghost btn-sm" style="flex: 1;">Registrarse</button>
      </div>

      <form id="form-auth" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="field-group">
          <label class="field-label" for="auth-email">Correo Electrónico</label>
          <input
            type="email"
            id="auth-email"
            class="input-well"
            required
            placeholder="tu@email.com"
            inputmode="email"
            autocomplete="email"
            autocapitalize="none"
            enterkeyhint="next"
          />
        </div>
        <div class="field-group">
          <label class="field-label" for="auth-password">Contraseña</label>
          <input
            type="password"
            id="auth-password"
            class="input-well"
            required
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            autocomplete="current-password"
            enterkeyhint="done"
          />
        </div>
        <div class="modal-actions">
          <button type="button" id="btn-cancel-auth" class="btn btn-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-auth" class="btn btn-primary">Entrar</button>
        </div>
      </form>
    </div>
  `;

  let mode: 'login' | 'register' = 'login';
  const tabLogin = document.getElementById('btn-tab-login')!;
  const tabRegister = document.getElementById('btn-tab-register')!;
  const btnSubmit = document.getElementById('btn-submit-auth')!;
  const passwordInput = document.getElementById('auth-password') as HTMLInputElement | null;

  tabLogin.addEventListener('click', () => {
    mode = 'login';
    tabLogin.className = 'btn btn-primary btn-sm';
    tabRegister.className = 'btn btn-ghost btn-sm';
    btnSubmit.textContent = 'Entrar';
    if (passwordInput) passwordInput.autocomplete = 'current-password';
  });

  tabRegister.addEventListener('click', () => {
    mode = 'register';
    tabRegister.className = 'btn btn-primary btn-sm';
    tabLogin.className = 'btn btn-ghost btn-sm';
    btnSubmit.textContent = 'Registrarse';
    if (passwordInput) passwordInput.autocomplete = 'new-password';
  });

  document.getElementById('btn-cancel-auth')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-auth-top')?.addEventListener('click', closeModal);

  document.getElementById('form-auth')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('auth-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('auth-password') as HTMLInputElement).value;

    try {
      if (mode === 'login') {
        await api.login(email, password);
        showToast('Bienvenido. Sesión iniciada.');
      } else {
        await api.register(email, password);
        showToast('Cuenta creada exitosamente.');
      }
      closeModal();
      onSuccess();
    } catch (err: any) {
      showToast(err.message, true);
    }
  });
};
