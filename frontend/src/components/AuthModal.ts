import { api } from '../services/api.js';

export const renderAuthModal = (
  onSuccess: () => void,
  showToast: (msg: string, isError?: boolean) => void
) => {
  const modalBackdrop = document.getElementById('modal-container')!;
  modalBackdrop.classList.remove('hidden');

  const token = api.getToken();

  if (token) {
    // Show logged-in profile
    modalBackdrop.innerHTML = `
      <div class="modal-content" style="max-width: 400px; text-align: center;">
        <h2 style="margin-bottom: 1rem;">Mi Cuenta</h2>
        <p style="color: var(--accent-green); margin-bottom: 1.5rem;">✅ Sesión activa con JWT</p>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button id="btn-logout" class="btn btn-danger">Cerrar Sesión</button>
          <button id="btn-close-auth" class="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      api.setToken(null);
      showToast('Sesión cerrada.');
      modalBackdrop.classList.add('hidden');
      onSuccess();
    });

    document.getElementById('btn-close-auth')?.addEventListener('click', () => {
      modalBackdrop.classList.add('hidden');
    });
    return;
  }

  modalBackdrop.innerHTML = `
    <div class="modal-content" style="max-width: 440px;">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
        <button id="btn-tab-login" class="btn btn-primary" style="flex: 1;">Iniciar Sesión</button>
        <button id="btn-tab-register" class="btn btn-secondary" style="flex: 1;">Registrarse</button>
      </div>

      <form id="form-auth" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="font-size: 0.85rem; color: var(--text-muted);">Correo Electrónico</label>
          <input type="email" id="auth-email" class="input-search" style="width: 100%;" required placeholder="tu@email.com" />
        </div>
        <div>
          <label style="font-size: 0.85rem; color: var(--text-muted);">Contraseña</label>
          <input type="password" id="auth-password" class="input-search" style="width: 100%;" required placeholder="••••••••" minlength="6" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
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

  tabLogin.addEventListener('click', () => {
    mode = 'login';
    tabLogin.className = 'btn btn-primary';
    tabRegister.className = 'btn btn-secondary';
    btnSubmit.innerText = 'Entrar';
  });

  tabRegister.addEventListener('click', () => {
    mode = 'register';
    tabRegister.className = 'btn btn-primary';
    tabLogin.className = 'btn btn-secondary';
    btnSubmit.innerText = 'Registrarse';
  });

  document.getElementById('btn-cancel-auth')?.addEventListener('click', () => {
    modalBackdrop.classList.add('hidden');
  });

  document.getElementById('form-auth')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('auth-email') as HTMLInputElement).value;
    const password = (document.getElementById('auth-password') as HTMLInputElement).value;

    try {
      if (mode === 'login') {
        await api.login(email, password);
        showToast('¡Bienvenido! Sesión iniciada.');
      } else {
        await api.register(email, password);
        showToast('¡Cuenta creada exitosamente!');
      }
      modalBackdrop.classList.add('hidden');
      onSuccess();
    } catch (err: any) {
      showToast(err.message, true);
    }
  });
};
