/**
 * Supabase Predictions Logic
 * Gère la sauvegarde et le chargement des prédictions depuis Supabase
 */

// Initialiser le client Supabase
const db = window.supabaseClient;

/**
 * Génère un ID unique pour l'utilisateur (fallback si pas connecté)
 */
function generateUserCode() {
    let code = localStorage.getItem('user_code');
    if (!code) {
        // Format: PRED-XXXX-XXXX
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        code = `PRED-${part1}${part2}`;
        localStorage.setItem('user_code', code);
    }
    return code;
}

/**
 * Sauvegarde la prédiction dans Supabase
 */
async function savePredictionToSupabase(characterId, characterName) {
    if (!db) {
        console.warn('Supabase client not available, skipping cloud save');
        return;
    }

    const userCode = generateUserCode();

    // Récupérer le profil LOCAL du visiteur
    // (Plus besoin de Session Twitch, on fait confiance au LocalStorage du navigateur)
    const guestName = localStorage.getItem('guest_username') || 'Visiteur';
    const guestAvatar = localStorage.getItem('guest_avatar') || 'assets/secret-monkey.png';

    // 1. Check si l'utilisateur a déjà une prédiction
    const { data: existingData, error: fetchError } = await db
        .from('predictions')
        .select('id')
        .eq('user_code', userCode)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching prediction:', fetchError);
        return;
    }

    const predictionData = {
        user_code: userCode,
        character_id: characterId,
        character_name: characterName,
        prediction_date: new Date().toISOString(),
        is_locked: false, // Par défaut non verrouillé
        username: guestName, // On envoie le pseudo local
        avatar_url: guestAvatar // On envoie l'avatar local
    };

    let error;

    if (existingData) {
        // Update
        const { error: updateError } = await db
            .from('predictions')
            .update(predictionData)
            .eq('user_code', userCode);
        error = updateError;
    } else {
        // Insert
        const { error: insertError } = await db
            .from('predictions')
            .insert([predictionData]);
        error = insertError;
    }

    if (error) {
        console.error('Error saving to Supabase:', error);
    } else {
        console.log('✅ Prédiction sauvegardée dans Supabase avec profil invité');
    }
}

// Make sure savePredictionToSupabase is also global if needed by script.js
window.savePredictionToSupabase = savePredictionToSupabase;

/**
 * Charger la prédiction depuis Supabase
 */
async function loadPredictionFromSupabase() {
    const userCode = generateUserCode(); // Use common function

    if (!db) {
        console.error('❌ Supabase client not initialized');
        return null;
    }

    try {
        const { data, error } = await db
            .from('predictions')
            .select('*')
            .eq('user_code', userCode)
            .maybeSingle();

        if (error) {
            console.error('Error loading prediction:', error);
            return null;
        }

        if (data) {
            console.log('✅ Prédiction chargée depuis Supabase:', data);

            // Synchroniser avec localStorage
            localStorage.setItem('prediction_2026_id', data.character_id);
            localStorage.setItem('prediction_2026_name', data.character_name);
            if (data.is_locked) {
                localStorage.setItem('prediction_2026_locked', 'true');
            }
            return data;
        }

        return null;
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        return null;
    }
}

// Also export loading function if needed
window.loadPredictionFromSupabase = loadPredictionFromSupabase;

/**
 * Verrouiller une prédiction
 */
async function lockPredictionInSupabase() {
    const userCode = generateUserCode();

    if (!db) return false;

    try {
        // Mettre à jour avec le dernier pseudo connu au moment du lock
        const guestName = localStorage.getItem('guest_username') || 'Visiteur';
        const guestAvatar = localStorage.getItem('guest_avatar') || 'assets/secret-monkey.png';

        const updateData = {
            is_locked: true,
            username: guestName,
            avatar_url: guestAvatar
        };

        const { data, error } = await db
            .from('predictions')
            .update(updateData)
            .eq('user_code', userCode)
            .select();

        if (error) throw error;

        console.log('🔒 Prédiction verrouillée dans Supabase:', data);
        localStorage.setItem('prediction_2026_locked', 'true');

        return true;
    } catch (error) {
        console.error('❌ Erreur lors du verrouillage:', error);
        // On lock quand même en local pour l'UX
        localStorage.setItem('prediction_2026_locked', 'true');
        return false;
    }
}
window.lockPredictionInSupabase = lockPredictionInSupabase;

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Chargement de la prédiction depuis Supabase...');
    const prediction = await loadPredictionFromSupabase();

    if (prediction && window.updatePredictionUI) {
        window.updatePredictionUI(prediction.character_id);
    }
});
