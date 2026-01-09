document.addEventListener('DOMContentLoaded', () => {
    // 1. Easter Egg Logic for February
    const flipper = document.querySelector('.secret-flipper');
    if (flipper) {
        initFebEasterEgg(flipper);
    }

    function initFebEasterEgg(card) {
        let resetTimer = null;
        const audio = new Audio('assets/allo_salam.mp3');

        const triggerFlip = (e) => {
            e.preventDefault();

            if (card.classList.contains('is-flipped')) return;

            // Flip the card
            card.classList.add('is-flipped');

            // Play the "Allo Salam" audio
            audio.currentTime = 0; // Reset to start if already played
            audio.play().catch(err => console.log("Audio play blocked:", err));

            // Auto-reset after 3 seconds
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
                card.classList.remove('is-flipped');
            }, 3000);
        };

        // Double Click / Double Tap Trigger
        card.addEventListener('dblclick', triggerFlip);
    }

    // 2. Auth Logic
    const loginBtn = document.getElementById('login-twitch-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    const authContainer = document.getElementById('auth-container');

    if (loginBtn && typeof signInWithTwitch === 'function') {
        loginBtn.addEventListener('click', signInWithTwitch);
    }

    if (logoutBtn && typeof signOut === 'function') {
        logoutBtn.addEventListener('click', signOut);
    }

    // Check Session
    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Logged In
                if (loginBtn) loginBtn.classList.add('hidden');
                if (userProfile) {
                    userProfile.classList.remove('hidden');
                    const avatar = document.getElementById('user-avatar');
                    const name = document.getElementById('user-name');

                    if (avatar && session.user.user_metadata.avatar_url) {
                        avatar.src = session.user.user_metadata.avatar_url;
                    }
                    if (name) {
                        name.textContent = session.user.user_metadata.full_name || session.user.user_metadata.name;
                    }
                }
            } else {
                // Logged Out
                if (loginBtn) loginBtn.classList.remove('hidden'); // Ensure visible
                if (userProfile) userProfile.classList.add('hidden');
            }
        });
    }

});

/**
 * Switch between different timeline years (2024 / 2025 / 2026)
 * @param {string} year - The year to display
 * @param {boolean} showScroll - Whether to scroll (default true)
 */
function switchYear(year, showScroll = true) {
    if (year === '2024') {
        const modal = document.getElementById('construction-modal');
        if (modal) {
            modal.classList.add('active');
            // Play a sound if desired, or just show visuals
        }
        return;
    }

    // 1. Update Buttons State
    document.querySelectorAll('.year-link').forEach(link => {
        link.classList.remove('active');
    });
    const btn = document.getElementById(`btn-${year}`);
    if (btn) btn.classList.add('active');

    // 2. Update Timeline Visibility
    document.querySelectorAll('.timeline-year').forEach(timeline => {
        timeline.classList.remove('active');
        // Clear any inline styles set by the immediate initialization script
        timeline.style.display = '';
        timeline.style.opacity = '';
        timeline.style.animation = '';
    });
    const timeline = document.getElementById(`timeline-${year}`);
    if (timeline) timeline.classList.add('active');

    // 3. Persist selection
    localStorage.setItem('selectedYear', year);

    // 4. Scroll to top if requested
    if (showScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function closeConstructionModal() {
    const modal = document.getElementById('construction-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Prediction Feature Logic

function openPredictionModal() {
    const modal = document.getElementById('prediction-modal');
    if (modal) {
        modal.classList.add('active');
        // Initialize 3D Classes
        updateCarouselClasses();
    }
}

function closePredictionModal() {
    const modal = document.getElementById('prediction-modal');
    if (modal) modal.classList.remove('active');
}

let currentSlideIndex = 0;



function moveCarousel(direction) {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);

    currentSlideIndex += direction;

    if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    } else if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    }

    updateCarouselClasses(slides);
}

function updateCarouselClasses(slides) {
    if (!slides) {
        slides = Array.from(document.querySelectorAll('.carousel-slide'));
    }

    // Clear all connection classes
    slides.forEach(slide => {
        slide.classList.remove('active', 'prev', 'next', 'current-slide');
    });

    // 1. Active (Center)
    slides[currentSlideIndex].classList.add('active', 'current-slide');

    // 2. Previous (Left)
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) prevIndex = slides.length - 1;
    slides[prevIndex].classList.add('prev');

    // 3. Next (Right)
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    slides[nextIndex].classList.add('next');
}

function submitCurrentPrediction() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const currentSlide = slides[currentSlideIndex];

    if (currentSlide) {
        const id = currentSlide.dataset.id;
        const name = currentSlide.dataset.name;
        makePrediction(id, name);
    }
}

function makePrediction(characterId, characterName) {
    // 1. Save to Supabase (cloud backup)
    if (typeof savePredictionToSupabase === 'function') {
        savePredictionToSupabase(characterId, characterName);
    }

    // 2. Save to Local Storage (local backup)
    localStorage.setItem('prediction_2026_id', characterId);
    localStorage.setItem('prediction_2026_name', characterName);

    // 3. Update UI
    updatePredictionUI(characterId);

    // 4. Close Modal
    closePredictionModal();
}


function resetPrediction(e) {
    if (e) e.stopPropagation();
    localStorage.removeItem('prediction_2026_id');
    localStorage.removeItem('prediction_2026_name');

    // Get current language or default to 'fr'
    const currentLang = localStorage.getItem('selectedLang') || 'fr';
    const texts = translations[currentLang];

    // Restore Question Mark UI
    const box = document.getElementById('box-jan-2026');
    if (box) {
        box.innerHTML = `
            <div class="prediction-placeholder" onclick="openPredictionModal()">
                <div class="question-mark">?</div>
                <span class="predict-label">${texts.predict_label}</span>
            </div>
            <div class="triangle-indicator"></div>
        `;
    }
}

function updatePredictionUI(characterId) {
    const box = document.getElementById('box-jan-2026');
    if (!box) return;

    // Get current language or default to 'fr'
    const currentLang = localStorage.getItem('selectedLang') || 'fr';
    const texts = translations[currentLang];

    const isLocked = localStorage.getItem('prediction_2026_locked') === 'true';

    // Resolve dynamic name based on ID and language
    const safeId = characterId || '';
    const translationKey = 'name_' + safeId;
    // Fallback to what was stored if not found (though structure implies ID is key)
    let characterName = '';
    if (texts[translationKey]) {
        characterName = texts[translationKey];
    } else {
        characterName = localStorage.getItem('prediction_2026_name') || '';
    }

    // Environment check: Only show reset button if running locally (only for the creator)
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:';

    // Determine extension (Buu and Vegeta SSJ3 use .jpg, others .png)
    const ext = (characterId === 'pred_buu' || characterId === 'pred_vegeta_ssj3_daima') ? 'jpg' : 'png';

    // REVEAL LOGIC : Simulation du résultat (Mardi 22:10)
    // Pour tester, on définit que "pred_buu" est le gagnant.
    const REVEALED_WINNER_ID = 'pred_buu'; // ID du personnage gagnant (ex: Buuhan)

    // Determine status text/class based on reveal
    let statusText = isLocked ? (currentLang === 'fr' ? 'PRÉDICTION VALIDÉE' : 'PREDICTION LOCKED') : (currentLang === 'fr' ? 'VOTRE PRÉDICTION' : 'YOUR PREDICTION');
    let statusClass = isLocked ? 'is-locked' : '';
    let isWinner = false;

    // Si on a un gagnant DÉVOILÉ, on écrase le statut
    if (REVEALED_WINNER_ID) {
        if (characterId === REVEALED_WINNER_ID) {
            statusText = currentLang === 'fr' ? '🎉 GAGNÉ !' : '🎉 WINNER !';
            statusClass = 'is-winner'; // Nouvelle classe CSS à ajouter
            isWinner = true;
        } else {
            statusText = currentLang === 'fr' ? 'PERDU...' : 'LOST...';
            statusClass = 'is-loser'; // Nouvelle classe CSS à ajouter
        }
    }

    // Build the UI
    box.innerHTML = `
        <div class="prediction-result ${statusClass}">
            <div class="prediction-status-badge ${isWinner ? 'winner-badge' : ''}">${statusText}</div>
            <div class="character-wrapper">
                <img src="assets/${characterId}.${ext}" class="char-art" alt="Prediction">
                <div class="card-name-large">${characterName}</div>
            </div>
            ${(!isLocked && !REVEALED_WINNER_ID) ? `
                <div class="prediction-controls">
                    <button class="result-btn btn-changer">${translations[currentLang].btn_choose === 'CHOISIR' ? 'CHANGER' : 'CHANGE'}</button>
                    <button class="result-btn btn-valider">${translations[currentLang].btn_choose === 'CHOISIR' ? 'VALIDER' : 'CONFIRM'}</button>
                </div>
            ` : (isLocal && !REVEALED_WINNER_ID ? `
                <div class="local-reset-wrapper">
                    <button class="local-only-reset" title="${currentLang === 'fr' ? 'Réinitialiser (Local uniquement - Créateur)' : 'Reset (Local only - Creator)'}">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            ` : '')}
            <div class="triangle-indicator"></div>
        </div>
    `;

    // Add listeners only if not locked AND not revealed
    if (!isLocked && !REVEALED_WINNER_ID) {
        const changerBtn = box.querySelector('.btn-changer');
        if (changerBtn) {
            changerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openPredictionModal();
            });
        }

        const validerBtn = box.querySelector('.btn-valider');
        if (validerBtn) {
            validerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const confirmMsg = currentLang === 'fr'
                    ? 'Voulez-vous valider cette prédiction ? Vous ne pourrez plus la changer.'
                    : 'Do you want to lock this prediction? You will not be able to change it anymore.';
                if (confirm(confirmMsg)) {
                    lockPrediction();
                }
            });
        }
    } else if (isLocal && !REVEALED_WINNER_ID) {
        // Local reset for the owner (discreet and only on local dev)
        const localResetBtn = box.querySelector('.local-only-reset');
        if (localResetBtn) {
            localResetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.removeItem('prediction_2026_locked');
                resetPrediction();
            });
        }
    }
}

function lockPrediction() {
    // Save to Supabase
    if (typeof lockPredictionInSupabase === 'function') {
        lockPredictionInSupabase();
    }

    // Save to localStorage
    localStorage.setItem('prediction_2026_locked', 'true');
    const savedId = localStorage.getItem('prediction_2026_id');
    updatePredictionUI(savedId);
}

// Check for existing prediction on load
document.addEventListener('DOMContentLoaded', () => {
    const savedPrediction = localStorage.getItem('prediction_2026_id');
    if (savedPrediction) {
        updatePredictionUI(savedPrediction);
    }
});
/* =========================================
   Quick Language Selector & Translation
   ========================================= */

const translations = {
    fr: {
        header_title: "Calendrier des Sorties Majeures : <span class='text-sparking'>Sparking</span>, <span class='text-ll'>Legends Limited</span> & <span class='text-ultra' data-text='Ultra'>Ultra</span>",
        month_jan: "JANVIER",
        month_feb: "FÉVRIER",
        month_mar: "MARS",
        month_apr: "AVRIL",
        month_may: "MAI",
        month_jun: "JUIN",
        month_jul: "JUILLET",
        month_aug: "AOÛT",
        month_sep: "SEPTEMBRE",
        month_oct: "OCTOBRE",
        month_nov: "NOVEMBRE",
        month_dec: "DÉCEMBRE",
        footer_disclaimer: "©Bird Studio/Shueisha et Toei Animation.<br>©Bandai Namco Entertainment Inc.<br>Site fan non officiel, sans affiliation.",
        predict_label: "PRÉDICTION",
        prediction_modal_title: "<span class='large-q'>Q</span>UI SERA LE <span class='highlight-yellow'>PREMIER</span> <br class='mobile-only'>PERSONNAGE MAJEUR <br class='desktop-only'>DU MOIS DE <br class='mobile-only'><span class='highlight-yellow'>JANVIER</span> ?",
        btn_choose: "CHOISIR",
        lang_button_text: "Langues",
        name_pred_buu: "BUUHAN",
        name_pred_gomah: "GOMAH",
        name_pred_bojack: "BOJACK",
        name_pred_trunks: "TRUNKS",
        name_pred_vegeta_ssj3_daima: "VEGETA SSJ3",
        construction_text: "TRAVAUX EN COURS"
    },
    en: {
        header_title: "Major Release Timeline: <span class='text-sparking'>Sparking</span>, <span class='text-ll'>Legends Limited</span> & <span class='text-ultra' data-text='Ultra'>Ultra</span>",
        month_jan: "JANUARY",
        month_feb: "FEBRUARY",
        month_mar: "MARCH",
        month_apr: "APRIL",
        month_may: "MAY",
        month_jun: "JUNE",
        month_jul: "JULY",
        month_aug: "AUGUST",
        month_sep: "SEPTEMBER",
        month_oct: "OCTOBER",
        month_nov: "NOVEMBER",
        month_dec: "DECEMBER",
        footer_disclaimer: "©Bird Studio/Shueisha and Toei Animation.<br>©Bandai Namco Entertainment Inc.<br>Unofficial fan site, not affiliated.",
        predict_label: "PREDICTION",
        prediction_modal_title: "<span class='large-q'>W</span>HO WILL BE THE <span class='highlight-yellow'>FIRST</span> <br class='mobile-only'>MAJOR CHARACTER <br class='desktop-only'>OF <br class='mobile-only'><span class='highlight-yellow'>JANUARY</span> ?",
        btn_choose: "CHOOSE",
        lang_button_text: "Language",
        name_pred_buu: "BUUHAN",
        name_pred_gomah: "GOMAH",
        name_pred_bojack: "BOUJACK",
        name_pred_trunks: "TRUNKS",
        name_pred_vegeta_ssj3_daima: "SS3 VEGETA",
        construction_text: "WORK IN PROGRESS"
    }
};

function toggleLanguageMenu() {
    const dropdown = document.getElementById('langDropdown');
    const btn = document.getElementById('langBtn');
    dropdown.classList.toggle('show');
    btn.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const container = document.querySelector('.language-selector');
    if (container && !container.contains(e.target)) {
        const dropdown = document.getElementById('langDropdown');
        const btn = document.getElementById('langBtn');
        if (dropdown) dropdown.classList.remove('show');
        if (btn) btn.classList.remove('active');
    }
});

function setLanguage(lang) {
    // 1. Save to localStorage
    localStorage.setItem('selectedLang', lang);

    // 2. Update all elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // 2b. Explicitly update construction text to ensure it catches dynamic changes
    const constructionMsg = document.getElementById('construction-msg');
    if (constructionMsg && translations[lang] && translations[lang].construction_text) {
        constructionMsg.textContent = translations[lang].construction_text;
    }

    // Re-render prediction UI to update text
    const savedPrediction = localStorage.getItem('prediction_2026_id');
    if (savedPrediction) {
        updatePredictionUI(savedPrediction);
    } else {
        resetPrediction();
    }

    // 3. Update active state on language options
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.remove('active');
    });
    const activeOption = document.getElementById('lang-' + lang);
    if (activeOption) {
        activeOption.classList.add('active');
    }

    // 4. Close dropdown
    const dropdown = document.getElementById('langDropdown');
    const btn = document.getElementById('langBtn');
    if (dropdown) dropdown.classList.remove('show');
    if (btn) btn.classList.remove('active');
}

// Initialize on load
(function initLanguage() {
    const savedLang = localStorage.getItem('selectedLang') || 'fr';
    setLanguage(savedLang);
})();
