const ONBOARDING_QUERY_KEYS = ['onboarding', 'showOnboarding'] as const;

export function isOnboardingForcedValue(value: string | null): boolean {
  return value === '1' || value === 'true';
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('speeda_onboarding_done') === '1';
}

export function shouldShowOnboarding(force = false): boolean {
  return force || !hasCompletedOnboarding();
}

export function markOnboardingCompleted() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('speeda_onboarding_done', '1');
  document.cookie = 'speeda_onboarding_done=1; path=/; max-age=31536000; SameSite=Lax';
}

export function addOnboardingParam(path: string, shouldAdd: boolean): string {
  if (!shouldAdd) return path;
  const [pathname, existingQuery = ''] = path.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set('onboarding', '1');
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function stripOnboardingParams(pathname: string, params: URLSearchParams): string {
  const cleaned = new URLSearchParams(params.toString());
  for (const key of ONBOARDING_QUERY_KEYS) cleaned.delete(key);
  const qs = cleaned.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
