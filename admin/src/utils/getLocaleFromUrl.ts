export const getLocaleFromUrl = (): string => {
  try {
    // Works for both main URL and hash fragment
    const params = new URL(window.location.href).searchParams;
    return params.get('plugins[i18n][locale]') || 'en';
  } catch {
    return 'en';
  }
};
