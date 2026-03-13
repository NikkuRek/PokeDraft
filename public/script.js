let allPokemon = [];
let selectedPokemon = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPokemon();
  setupSearch();
  setupSubmit();
});

async function loadPokemon() {
  try {
    const response = await fetch('/api/pokemon');
    if (response.ok) {
      allPokemon = await response.json();
      displayPokemon(allPokemon);
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cargar los datos de Pokémon.' });
    }
  } catch (error) {
    console.error('Error loading Pokémon:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cargar los datos de Pokémon.' });
  }
}

function displayPokemon(pokemonList) {
  const listElement = document.getElementById('pokemonList');
  listElement.innerHTML = '';

  pokemonList.forEach(pokemon => {
    const card = document.createElement('div');
    // Using custom glass-card class and making it look like a cool trading card
    card.className = 'glass-card rounded-xl p-4 sm:p-5 flex flex-col justify-center items-center text-center relative overflow-hidden group cursor-pointer';
    
    // Make the entire card clickable to toggle checkbox
    card.onclick = (e) => {
      if(e.target.tagName !== 'INPUT') {
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.click();
      }
    };

    card.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="flex-1 w-full relative z-10 z-10 mb-3">
        <p class="text-xs font-bold text-blue-300/80 mb-1 tracking-wider uppercase">#${pokemon.id.toString().padStart(3, '0')}</p>
        <h3 class="font-extrabold capitalize text-lg sm:text-xl text-white tracking-wide break-words">${pokemon.name}</h3>
      </div>
      <div class="relative z-10 w-full pt-3 border-t border-white/10 flex justify-center">
        <label class="flex items-center justify-center space-x-2 cursor-pointer w-full py-1">
          <input type="checkbox" value="${pokemon.name}" class="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer transition-all" onchange="toggleSelection('${pokemon.name}')">
          <span class="text-sm font-semibold text-blue-100 select-none">Elegir</span>
        </label>
      </div>
    `;
    listElement.appendChild(card);
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allPokemon.filter(p => p.name.toLowerCase().includes(query));
    displayPokemon(filtered);
  });
}

function toggleSelection(name) {
  const index = selectedPokemon.indexOf(name);
  if (index > -1) {
    selectedPokemon.splice(index, 1);
  } else {
    if (selectedPokemon.length < 5) {
      selectedPokemon.push(name);
    } else {
      // Uncheck the checkbox if already 5 selected
      event.target.checked = false;
      Swal.fire({ icon: 'warning', title: 'Límite alcanzado', text: 'Solo puedes seleccionar hasta 5 Pokémon.' });
      return;
    }
  }
  updateSelectedList();
  updateSubmitButton();
}

function updateSelectedList() {
  const container = document.getElementById('selectedList');
  const listElement = document.getElementById('selectedItems');
  const countElement = document.getElementById('selectedCount');
  
  listElement.innerHTML = '';
  countElement.textContent = selectedPokemon.length;
  
  if (selectedPokemon.length > 0) {
    container.classList.remove('hidden');
    container.classList.add('animate-fade-in');
  } else {
    container.classList.add('hidden');
    container.classList.remove('animate-fade-in');
  }

  selectedPokemon.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-100 rounded-lg text-sm font-medium capitalize flex items-center shadow-inner';
    li.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
      ${name}
    `;
    listElement.appendChild(li);
  });
}

function updateSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  const userName = document.getElementById('userName').value.trim();
  submitBtn.disabled = selectedPokemon.length !== 5 || !userName;
}

function setupSubmit() {
  document.getElementById('userName').addEventListener('input', updateSubmitButton);
  document.getElementById('submitBtn').addEventListener('click', async () => {
    const userName = document.getElementById('userName').value.trim();
    if (!userName || selectedPokemon.length !== 5) return;

    const today = new Date().toDateString();
    const lastRegistration = localStorage.getItem('pokeDraft_lastRegistration');

    if (lastRegistration === today) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Límite de dispositivo', 
        text: 'Ya registró un equipo hoy. Intenta de nuevo mañana.' 
      });
      return;
    }

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, selectedPokemon })
      });

      if (response.ok) {
        localStorage.setItem('pokeDraft_lastRegistration', today);
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Selección guardada exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        // Reset
        selectedPokemon = [];
        updateSelectedList();
        updateSubmitButton();
        document.getElementById('userName').value = '';
        
        // Uncheck all checkboxes visually
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      } else {
        const error = await response.json();
        Swal.fire({ icon: 'error', title: 'Oops...', text: error.error || 'Error en el servidor.' });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar la selección.' });
    }
  });
}