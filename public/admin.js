document.addEventListener('DOMContentLoaded', () => {
  loadRegistros();
  setupResetBtn();
});

function setupResetBtn() {
  document.getElementById('resetDbBtn').addEventListener('click', async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Esto borrará todos los registros de la base de datos permanentemente!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/registros', {
          method: 'DELETE'
        });

        if (response.ok) {
          Swal.fire({
            title: '¡Reiniciado!',
            text: 'La base de datos se ha borrado con éxito.',
            icon: 'success',
            background: '#1e293b',
            color: '#fff'
          });
          loadRegistros(); // Refresh table
        } else {
          throw new Error('Failed to delete records');
        }
      } catch (error) {
        console.error('Error resetting DB:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al intentar reiniciar la base de datos.',
          icon: 'error',
          background: '#1e293b',
          color: '#fff'
        });
      }
    }
  });
}

async function loadRegistros() {
  try {
    const response = await fetch('/api/registros');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const registros = await response.json();
    displayRegistros(registros);
  } catch (error) {
    console.error('Error loading registers:', error);
    document.getElementById('recordCount').textContent = 'Error';
    document.getElementById('recordCount').classList.replace('text-blue-600', 'text-red-600');
    Swal.fire({
      icon: 'error',
      title: 'Error de carga',
      text: 'Ocurrió un error al cargar los registros desde el servidor.'
    });
  }
}

function displayRegistros(registros) {
  const tableBody = document.getElementById('registrosList');
  const recordCount = document.getElementById('recordCount');
  
  tableBody.innerHTML = '';
  recordCount.textContent = registros.length;

  if (registros.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
          No hay registros disponibles.
        </td>
      </tr>
    `;
    return;
  }

  registros.forEach(registro => {
    // Format the date uniquely
    const dateObj = new Date(registro.created_at);
    const dateStr = dateObj.toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-5 py-5 border-b border-white/10 text-sm bg-white/5 group-hover:bg-white/10 transition-colors">
        <p class="text-blue-200 whitespace-no-wrap font-medium">#${registro.id}</p>
      </td>
      <td class="px-5 py-5 border-b border-white/10 text-sm bg-white/5 group-hover:bg-white/10 transition-colors">
        <p class="text-white whitespace-no-wrap font-bold tracking-wide">${registro.user_name}</p>
      </td>
      <td class="px-5 py-5 border-b border-white/10 text-sm bg-white/5 group-hover:bg-white/10 transition-colors">
        <div class="flex flex-wrap gap-2">
          <span class="px-3 py-1 bg-cyan-900/50 border border-cyan-500/30 text-cyan-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">${registro.poke1}</span>
          <span class="px-3 py-1 bg-green-900/50 border border-green-500/30 text-green-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">${registro.poke2}</span>
          <span class="px-3 py-1 bg-purple-900/50 border border-purple-500/30 text-purple-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">${registro.poke3}</span>
          <span class="px-3 py-1 bg-orange-900/50 border border-orange-500/30 text-orange-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">${registro.poke4}</span>
          <span class="px-3 py-1 bg-pink-900/50 border border-pink-500/30 text-pink-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">${registro.poke5}</span>
        </div>
      </td>
      <td class="px-5 py-5 border-b border-white/10 text-sm bg-white/5 group-hover:bg-white/10 transition-colors">
        <p class="text-blue-300/70 whitespace-no-wrap">${dateStr}</p>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}
