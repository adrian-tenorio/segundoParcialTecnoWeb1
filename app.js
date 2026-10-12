const API_KEY = '84dc91a4d772477a6c2ca453c2b60ca9'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();


// ############################################################################
// #                                                                          #
// #                          TU CÓDIGO AQUÍ                    #
// #                                                                          #
// ############################################################################

//1) Carga inicial
const pedirJSON = async (url) => {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }
    return await respuesta.json();
};
 
const obtenerSeriesPopulares = async () => {
    const datos = await pedirJSON(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`);
    return datos.results;
};
 
const renderizarSeries = (series) => {
    seriesGrid.innerHTML = series.map(crearTarjeta).join('');
};
 
const mostrarResultados = (titulo, series) => {
    resultsTitle.textContent = titulo;
    resultsCount.textContent = `${series.length} resultados`;
    renderizarSeries(series);
};
 
const cargarPopulares = async () => {
    mostrarLoading();
    try {
        const series = await obtenerSeriesPopulares();
        console.log(`${series.length} series populares cargadas`);
        ocultarLoading();
        mostrarResultados('Series Populares', series);
    } catch (error) {
        manejarError(error);
    }
};

//2) Tarjeta de serie
const crearTarjeta = (serie) => {
    const { id, name, first_air_date, vote_average, poster_path } = serie;
    const año = first_air_date ? first_air_date.split('-')[0] : 'N/A';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
    const imagen = poster_path ? `<img class="serie-card__image" src="${IMAGE_URL}${poster_path}" alt="${name}">` : '';
    return `
        <article class="serie-card" data-id="${id}">
            <div class="serie-card__poster">
                ${imagen}
                <span class="serie-card__rating"> ${rating}</span>
            </div>
            <div class="serie-card__content">
                <h3 class="serie-card__title">${name}</h3>
                <p class="serie-card__year"> ${año}</p>
            </div>
        </article>
    `;
};


// 3) Busqueda
const buscarSeries = async (texto) => {
    const datos = await pedirJSON(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(texto)}&language=es-ES`);
    return datos.results;
};
 
const ejecutarBusqueda = async () => {
    const texto = searchInput.value.trim();
    if (texto === '') {
        await cargarPopulares();
        return;
    }
    mostrarLoading();
    try {
        const series = await buscarSeries(texto);
        console.log(`🔍 ${series.length} resultados para "${texto}"`);
        ocultarLoading();
        mostrarResultados(`Resultados para "${texto}"`, series);
    } catch (error) {
        manejarError(error);
    }
};
 
let temporizadorBusqueda;
 
searchInput.addEventListener('keyup', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(ejecutarBusqueda, 500);
});
 
clearBtn.addEventListener('click', () => {
    clearTimeout(temporizadorBusqueda);
    searchInput.value = '';
    cargarPopulares();
});


// 4) Modal de detalle

const obtenerDetalleSerie = async (id) => {
    return await pedirJSON(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`);
};
 
const mostrarModal = (serie) => {
    const { name, overview, number_of_seasons, number_of_episodes, genres, status } = serie;
    const generos = genres.length ? genres.map((genero) => genero.name).join(', ') : 'N/A';
    modalBody.innerHTML = `
        <h2 class="modal__title">${name}</h2>
        <div class="modal__info">
            <span> Temporadas: ${number_of_seasons}</span>
            <span> Episodios: ${number_of_episodes}</span>
            <span> Géneros: ${generos}</span>
            <span> Estado: ${status}</span>
        </div>
        <p class="modal__overview">${overview || 'Sin sinopsis disponible.'}</p>
    `;
    modal.classList.add('modal--show');
};
 
const cerrarModal = () => {
    modal.classList.remove('modal--show');
};
 
const verDetalleSerie = async (id) => {
    try {
        const serie = await obtenerDetalleSerie(id);
        console.log('📺 Detalle de la serie:', serie.name);
        mostrarModal(serie);
    } catch (error) {
        console.error(' Error:', error);
        mostrarNotificacion(obtenerMensajeError(error));
    }
};
 
seriesGrid.addEventListener('click', (event) => {
    const tarjeta = event.target.closest('.serie-card');
    if (tarjeta) {
        verDetalleSerie(tarjeta.dataset.id);
    }
});
 
modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);
 