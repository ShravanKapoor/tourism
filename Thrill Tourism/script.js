// Listings shown on the page. Add an object here to add a card.
// lat/lng are approximate and only used to sort by distance for "Near me".
const PLACES = [
    {
        id: 'kasauli-trip-faqs',
        title: 'Kasauli Trip FAQs',
        category: 'Blog',
        location: 'Solan',
        mapQuery: 'Kasauli, Himachal Pradesh',
        lat: 30.8987,
        lng: 76.9654,
        image: 'images/green-valley.jpg',
        alt: 'Green valley between grassy mountains',
        text: 'Answers to common questions about planning a trip to Kasauli, a hill town in Solan district.'
    },
    {
        id: 'sagar-thakur-dhaba',
        title: 'Sagar Thakur Dhaba',
        category: 'Blog',
        location: 'Manali',
        mapQuery: 'Manali, Himachal Pradesh',
        lat: 32.2432,
        lng: 77.1892,
        image: 'images/living-room.jpg',
        alt: 'Bright, modern living room',
        text: 'A dhaba to stop at for a meal on your trip to Manali.'
    },
    {
        id: 'siswan-dam',
        title: 'Siswan Dam',
        category: 'Blog',
        location: 'Chandigarh',
        mapQuery: 'Siswan Dam, Punjab',
        lat: 30.86,
        lng: 76.76,
        image: 'images/mountain-hut.jpg',
        alt: 'Wooden hut on a hillside meadow',
        text: 'A dam and reservoir in the Shivalik foothills, a short drive from Chandigarh.'
    },
    {
        id: 'hidden-waterfall-trek',
        title: 'Hidden Waterfall Trek',
        category: 'Blog',
        location: 'Shimla',
        mapQuery: 'Shimla, Himachal Pradesh',
        lat: 31.1048,
        lng: 77.1734,
        image: 'images/green-valley.jpg',
        alt: 'Green valley between grassy mountains',
        text: 'A trek to a waterfall tucked away in the hills near Shimla.'
    }
];

const FAV_KEY = 'thrill-tourism-favourites';

const state = {
    query: '',
    location: 'All',
    savedOnly: false,
    userPos: null,
    favourites: loadFavourites(),
    firstRender: true
};

const els = {
    cards: document.getElementById('cards'),
    filters: document.getElementById('filters'),
    search: document.getElementById('search'),
    resultCount: document.getElementById('resultCount'),
    emptyState: document.getElementById('emptyState'),
    clearFilters: document.getElementById('clearFilters'),
    mapFrame: document.getElementById('mapFrame'),
    mapCaption: document.getElementById('mapCaption'),
    locationMessage: document.getElementById('locationMessage'),
    nearMeButtons: document.querySelectorAll('.js-near-me')
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = ('IntersectionObserver' in window && !reduceMotion)
    ? new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 })
    : null;

/* ---------- Favourites (saved in this browser) ---------- */

function loadFavourites() {
    try {
        return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []);
    } catch (e) {
        return new Set();
    }
}

function saveFavourites() {
    try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...state.favourites]));
    } catch (e) {
        // Storage can be unavailable (private mode); favourites then last for this visit only.
    }
}

function toggleFavourite(id) {
    if (state.favourites.has(id)) {
        state.favourites.delete(id);
    } else {
        state.favourites.add(id);
    }
    saveFavourites();
}

/* ---------- Helpers ---------- */

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
}

function distanceKm(a, b) {
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function mapEmbedUrl(query, zoom) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}

function mapLinkUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function setMap(query, caption, zoom = 12) {
    els.mapFrame.src = mapEmbedUrl(query, zoom);
    els.mapCaption.textContent = caption;
}

function showPlaceOnMap(place) {
    setMap(place.mapQuery, `Showing ${place.title}, ${place.location}`);
    document.getElementById('map').scrollIntoView();
}

/* ---------- Filters ---------- */

function renderFilters() {
    const locations = ['All', ...new Set(PLACES.map(p => p.location))];
    const chips = locations.map(loc => {
        const active = !state.savedOnly && state.location === loc;
        return `<button type="button" class="btn btn-sm filter-chip ${active ? 'btn-primary' : 'btn-outline-primary'}"
            data-location="${escapeHtml(loc)}" aria-pressed="${active}">${escapeHtml(loc)}</button>`;
    });
    chips.push(`<button type="button" class="btn btn-sm filter-chip ${state.savedOnly ? 'btn-danger' : 'btn-outline-danger'}"
        data-saved="true" aria-pressed="${state.savedOnly}">
        <i class="bi bi-heart${state.savedOnly ? '-fill' : ''}"></i> Saved (${state.favourites.size})</button>`);
    els.filters.innerHTML = chips.join('');
}

function visiblePlaces() {
    const q = state.query.trim().toLowerCase();
    let list = PLACES.filter(p => {
        if (state.savedOnly && !state.favourites.has(p.id)) return false;
        if (!state.savedOnly && state.location !== 'All' && p.location !== state.location) return false;
        if (q && !`${p.title} ${p.location} ${p.category}`.toLowerCase().includes(q)) return false;
        return true;
    });
    if (state.userPos) {
        list = list
            .map(p => ({ ...p, distance: distanceKm(state.userPos, p) }))
            .sort((a, b) => a.distance - b.distance);
    }
    return list;
}

/* ---------- Cards ---------- */

function cardHtml(place) {
    const fav = state.favourites.has(place.id);
    const distance = place.distance !== undefined
        ? `<span class="badge text-bg-dark distance-badge"><i class="bi bi-signpost-2"></i> ~${Math.round(place.distance)} km away</span>`
        : '';
    return `
        <div class="col reveal">
            <article class="card data h-100 p-3 border border-primary" data-id="${escapeHtml(place.id)}">
                <div class="card-img-wrap">
                    <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.alt)}" loading="lazy">
                </div>
                ${distance}
                <button type="button" class="fav-btn" data-action="fav" aria-pressed="${fav}"
                    aria-label="${fav ? 'Remove' : 'Save'} ${escapeHtml(place.title)}" title="${fav ? 'Saved' : 'Save'}">
                    <i class="bi bi-heart${fav ? '-fill' : ''}"></i>
                </button>
                <div class="card-body px-1 pb-0 d-flex flex-column">
                    <h3 class="card-title fst-italic text-secondary fs-5 fw-normal">${escapeHtml(place.category)}</h3>
                    <button type="button" class="btn btn-link p-0 text-reset text-decoration-none fw-bolder stretched-link"
                        data-action="details">${escapeHtml(place.title)}</button>
                    <button type="button" class="btn btn-link p-0 mt-auto pt-3 align-self-end text-decoration-none card-location"
                        data-action="map" title="Show ${escapeHtml(place.location)} on the map">
                        <i class="bi bi-geo-alt"></i> ${escapeHtml(place.location)}
                    </button>
                </div>
            </article>
        </div>`;
}

function render() {
    const list = visiblePlaces();
    renderFilters();
    els.cards.innerHTML = list.map(cardHtml).join('');
    els.emptyState.classList.toggle('d-none', list.length > 0);
    els.resultCount.textContent = `Showing ${list.length} of ${PLACES.length} places` +
        (state.userPos ? ', nearest first' : '');

    els.cards.querySelectorAll('.reveal').forEach(el => {
        if (revealObserver && state.firstRender) {
            revealObserver.observe(el);
        } else {
            el.classList.add('visible');
        }
    });
    state.firstRender = false;
}

/* ---------- Details modal ---------- */

function openDetails(place) {
    const modalEl = document.getElementById('placeModal');
    document.getElementById('placeModalImg').src = place.image;
    document.getElementById('placeModalImg').alt = place.alt;
    document.getElementById('placeModalCategory').textContent = place.category;
    document.getElementById('placeModalTitle').textContent = place.title;
    document.getElementById('placeModalLocation').textContent = place.location;
    document.getElementById('placeModalText').textContent = place.text;
    document.getElementById('placeModalDirections').href = mapLinkUrl(place.mapQuery);

    const favBtn = document.getElementById('placeModalFav');
    const paintFav = () => {
        const fav = state.favourites.has(place.id);
        favBtn.innerHTML = `<i class="bi bi-heart${fav ? '-fill' : ''}"></i> ${fav ? 'Saved' : 'Save'}`;
        favBtn.setAttribute('aria-pressed', fav);
    };
    paintFav();
    favBtn.onclick = () => {
        toggleFavourite(place.id);
        paintFav();
        render();
    };

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    document.getElementById('placeModalMap').onclick = () => {
        modalEl.addEventListener('hidden.bs.modal', () => showPlaceOnMap(place), { once: true });
        modal.hide();
    };
    modal.show();
}

/* ---------- Near me ---------- */

function setNearMeBusy(busy) {
    els.nearMeButtons.forEach(btn => {
        btn.disabled = busy;
        const label = btn.dataset.label || (btn.dataset.label = btn.innerHTML);
        btn.innerHTML = busy
            ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span class="d-none d-sm-inline"> Locating…</span>'
            : label;
    });
}

function showLocationMessage(text) {
    els.locationMessage.textContent = text;
    els.locationMessage.classList.toggle('d-none', !text);
}

function nearMe() {
    showLocationMessage('');
    if (!('geolocation' in navigator) || !window.isSecureContext) {
        showLocationMessage('Your browser can\'t share your location here. "Near me" needs a secure (https) page.');
        return;
    }
    setNearMeBusy(true);
    navigator.geolocation.getCurrentPosition(pos => {
        setNearMeBusy(false);
        state.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMap(`${state.userPos.lat},${state.userPos.lng}`, 'Showing your location. Places are sorted nearest first.', 11);
        render();
        document.getElementById('listings').scrollIntoView();
    }, err => {
        setNearMeBusy(false);
        showLocationMessage(err.code === err.PERMISSION_DENIED
            ? 'Location access was blocked. Allow it in your browser to sort places by distance.'
            : 'We couldn\'t find your location. Please try again.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

/* ---------- Events ---------- */

els.search.addEventListener('input', () => {
    state.query = els.search.value;
    render();
});

els.filters.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.saved) {
        state.savedOnly = !state.savedOnly;
    } else {
        state.savedOnly = false;
        state.location = btn.dataset.location;
    }
    render();
});

els.cards.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const place = PLACES.find(p => p.id === btn.closest('[data-id]').dataset.id);
    if (btn.dataset.action === 'fav') {
        toggleFavourite(place.id);
        render();
        const newBtn = els.cards.querySelector(`[data-id="${place.id}"] .fav-btn`);
        if (newBtn) {
            newBtn.focus();
            if (!reduceMotion) newBtn.classList.add('pop');
        }
    } else if (btn.dataset.action === 'map') {
        showPlaceOnMap(place);
    } else {
        openDetails(place);
    }
});

els.clearFilters.addEventListener('click', () => {
    state.query = '';
    state.location = 'All';
    state.savedOnly = false;
    els.search.value = '';
    render();
});

els.nearMeButtons.forEach(btn => btn.addEventListener('click', nearMe));

// On small screens, close the menu first and then scroll, so the
// shrinking menu doesn't push the target heading out of view.
document.querySelectorAll('#mainNav .nav-link').forEach(link => {
    link.addEventListener('click', e => {
        const menu = document.getElementById('mainNav');
        if (!menu.classList.contains('show')) return;
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        menu.addEventListener('hidden.bs.collapse', () => {
            if (target) target.scrollIntoView();
            history.replaceState(null, '', link.getAttribute('href'));
        }, { once: true });
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
});

if (revealObserver) {
    document.querySelectorAll('main > section > .reveal').forEach(el => revealObserver.observe(el));
} else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

// Keep in-page links from hiding headings under the sticky header.
function updateScrollOffset() {
    const header = document.getElementById('siteHeader');
    document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 16}px`;
}
window.addEventListener('resize', updateScrollOffset);
updateScrollOffset();

render();
