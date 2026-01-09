/**
 * Supabase Predictions Logic
 * Gère la sauvegarde et le chargement des prédictions depuis Supabase
 */

// Initialiser le client Supabase
const db = window.supabaseClient;

/**
 * Sign in with Twitch
 */
async function signInWithTwitch() {
    if (!db) return;
    const { data, error } = await db.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
            redirectTo: window.location.href
        }
    });
    if (error) console.error('Error logging in:', error);
}

/**
 * Sign out
 */
async function signOut() {
    if (!db) return;
    const { error } = await db.auth.signOut();
    if (error) console.error('Error logging out:', error);
    else window.location.reload(); // Refresh to clear state
}

// Export functions globally
window.signInWithTwitch = signInWithTwitch;
window.signOut = signOut;

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

    // Check for authenticated user
    const { data: { session } } = await db.auth.getSession();
    let authData = {};

    if (session && session.user) {
        // User is logged in with Twitch
        authData = {
            username: session.user.user_metadata.full_name || session.user.user_metadata.name,
            avatar_url: session.user.user_metadata.avatar_url,
        };
    }

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
        ...authData // Ajoute les infos Twitch si disponibles
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
        console.log('✅ Prédiction sauvegardée dans Supabase');
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
        // Check for authenticated user to update Metadata on lock
        const { data: { session } } = await db.auth.getSession();
        let updateData = { is_locked: true };

        if (session && session.user) {
            updateData.username = session.user.user_metadata.full_name || session.user.user_metadata.name;
            updateData.avatar_url = session.user.user_metadata.avatar_url;
        }

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
    // Check session first
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        console.log("👤 User is signed in:", session.user.user_metadata.full_name);
    }

    console.log('🔄 Chargement de la prédiction depuis Supabase...');
    const prediction = await loadPredictionFromSupabase();

    // script.js handles the UI update if window.updatePredictionUI exists, 
    // or we can dispatch an event or let script.js call loadPredictionFromSupabase itself.
    // For now, let's just make sure data is in localStorage so script.js picks it up naturally
    // or call the UI update if available.
    if (prediction && window.updatePredictionUI) {
        window.updatePredictionUI(prediction.character_id);
    }
});
