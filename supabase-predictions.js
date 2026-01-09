/**
 * Supabase Predictions Logic
 * Gère la sauvegarde et le chargement des prédictions depuis Supabase
 */

// Initialiser le client Supabase
const supabase = window.supabaseClient;

/**
 * Sign in with Twitch
 */
async function signInWithTwitch() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
    });
    if (error) console.error('Error logging in:', error);
}

/**
 * Sign out
 */
async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    else window.location.reload(); // Refresh to clear state
}

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
    character_id: characterId,
        character_name: characterName,
            is_locked: false
}])
                .select();

if (error) throw error;
console.log('✅ Prédiction sauvegardée dans Supabase:', data);
        }

// Sauvegarder aussi en local (backup)
localStorage.setItem('prediction_2026_id', characterId);
localStorage.setItem('prediction_2026_name', characterName);

return true;
    } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    // Fallback sur localStorage si Supabase échoue
    localStorage.setItem('prediction_2026_id', characterId);
    localStorage.setItem('prediction_2026_name', characterName);
    return false;
}
}

// Charger la prédiction depuis Supabase
async function loadPredictionFromSupabase() {
    const userCode = getUserCode();

    if (!window.supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return null;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('predictions')
            .select('*')
            .eq('user_code', userCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Pas de prédiction trouvée
                console.log('ℹ️ Aucune prédiction trouvée pour ce code');
                return null;
            }
            throw error;
        }

        console.log('✅ Prédiction chargée depuis Supabase:', data);

        // Synchroniser avec localStorage
        localStorage.setItem('prediction_2026_id', data.character_id);
        localStorage.setItem('prediction_2026_name', data.character_name);
        if (data.is_locked) {
            localStorage.setItem('prediction_2026_locked', 'true');
        }

        return data;
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        // Fallback sur localStorage
        const localId = localStorage.getItem('prediction_2026_id');
        if (localId) {
            return {
                character_id: localId,
                character_name: localStorage.getItem('prediction_2026_name'),
                is_locked: localStorage.getItem('prediction_2026_locked') === 'true'
            };
        }
        return null;
    }
}

// Verrouiller une prédiction
async function lockPredictionInSupabase() {
    const userCode = getUserCode();

    if (!window.supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return false;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('predictions')
            .update({ is_locked: true })
            .eq('user_code', userCode)
            .select();

        if (error) throw error;

        console.log('🔒 Prédiction verrouillée dans Supabase:', data);
        localStorage.setItem('prediction_2026_locked', 'true');

        return true;
    } catch (error) {
        console.error('❌ Erreur lors du verrouillage:', error);
        localStorage.setItem('prediction_2026_locked', 'true');
        return false;
    }
}

// Récupérer une prédiction avec un code spécifique (pour migration d'appareil)
async function loadPredictionByCode(code) {
    if (!window.supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return null;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('predictions')
            .select('*')
            .eq('user_code', code)
            .single();

        if (error) throw error;

        // Sauvegarder le code et synchroniser
        localStorage.setItem('user_prediction_code', code);
        localStorage.setItem('prediction_2026_id', data.character_id);
        localStorage.setItem('prediction_2026_name', data.character_name);
        if (data.is_locked) {
            localStorage.setItem('prediction_2026_locked', 'true');
        }

        console.log('✅ Prédiction récupérée avec le code:', code);
        return data;
    } catch (error) {
        console.error('❌ Code invalide ou erreur:', error);
        return null;
    }
}

// Afficher le code utilisateur dans l'interface
function showUserCode() {
    const userCode = getUserCode();
    const currentLang = localStorage.getItem('selectedLang') || 'fr';

    const message = currentLang === 'fr'
        ? `Votre code de prédiction :\n\n${userCode}\n\nSauvegardez-le pour retrouver votre prédiction sur un autre appareil !`
        : `Your prediction code:\n\n${userCode}\n\nSave it to retrieve your prediction on another device!`;

    alert(message);
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Chargement de la prédiction depuis Supabase...');
    const prediction = await loadPredictionFromSupabase();

    if (prediction) {
        updatePredictionUI(prediction.character_id);
    }
});
