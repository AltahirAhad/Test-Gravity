/**
 * Supabase Predictions Logic
 * Gère la sauvegarde et le chargement des prédictions depuis Supabase
 */

// Générer un code utilisateur unique (format: PRED-XXXX)
function generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PRED-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Récupérer ou créer le code utilisateur
function getUserCode() {
    let userCode = localStorage.getItem('user_prediction_code');
    if (!userCode) {
        userCode = generateUserCode();
        localStorage.setItem('user_prediction_code', userCode);
        console.log('🆕 Nouveau code utilisateur créé:', userCode);
    }
    return userCode;
}

// Sauvegarder une prédiction dans Supabase
async function savePredictionToSupabase(characterId, characterName) {
    const userCode = getUserCode();

    if (!window.supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return false;
    }

    try {
        // Vérifier si l'utilisateur a déjà une prédiction
        const { data: existing, error: fetchError } = await window.supabaseClient
            .from('predictions')
            .select('*')
            .eq('user_code', userCode)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = pas de résultat trouvé (normal pour un nouvel utilisateur)
            throw fetchError;
        }

        if (existing) {
            // Mettre à jour la prédiction existante
            const { data, error } = await window.supabaseClient
                .from('predictions')
                .update({
                    character_id: characterId,
                    character_name: characterName,
                    updated_at: new Date().toISOString()
                })
                .eq('user_code', userCode)
                .select();

            if (error) throw error;
            console.log('✅ Prédiction mise à jour dans Supabase:', data);
        } else {
            // Créer une nouvelle prédiction
            const { data, error } = await window.supabaseClient
                .from('predictions')
                .insert([{
                    user_code: userCode,
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
