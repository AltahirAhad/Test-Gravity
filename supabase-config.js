/**
 * Supabase Configuration
 * Ce fichier contient la configuration pour se connecter à Supabase
 */

const SUPABASE_URL = 'https://poseijsmprxjfdeonuvd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3evjJlTJULnqPLjnl7bwcQ_IDgt-PFQ';

// Initialiser le client Supabase (attendre que la bibliothèque soit chargée)
let supabaseClient;

if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
} else {
    console.error('❌ Supabase library not loaded');
}

// Exporter pour utilisation globale
window.supabaseClient = supabaseClient;
