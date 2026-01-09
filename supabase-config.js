/**
 * Supabase Configuration
 * Ce fichier contient la configuration pour se connecter à Supabase
 */

const SUPABASE_URL = 'https://poseijsmprxjfdeonuvd.supabase.co';
/* Ligne 7 à remplacer */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvc2VpanNtcHJ4amZkZW9udXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODQzMTgsImV4cCI6MjA4MzU2MDMxOH0.JkhJB_JdbLmfyreyqmiNBdxSc0i2I0dylYCGBNySr_o';

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
