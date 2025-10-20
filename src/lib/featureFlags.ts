import { supabase } from './supabaseClient';

// Cache feature flags in memory for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let flagCache: { [key: string]: { value: boolean; timestamp: number } } = {};

export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  // Check cache first
  const cached = flagCache[featureName];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }

  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('feature_name', featureName)
      .single();

    if (error || !data) {
      console.warn(`Feature flag '${featureName}' not found, defaulting to false`);
      return false;
    }

    // Update cache
    flagCache[featureName] = {
      value: data.is_enabled,
      timestamp: Date.now(),
    };

    return data.is_enabled;
  } catch (err) {
    console.error('Error checking feature flag:', err);
    return false;
  }
}

export function clearFeatureFlagCache() {
  flagCache = {};
}

// Pre-defined feature flags
export const FeatureFlags = {
  REVIEW_SYSTEM: 'review_system',
  QR_CHECKINS: 'qr_checkins',
} as const;
