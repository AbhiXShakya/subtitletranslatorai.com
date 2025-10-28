type Theme = 'light' | 'dark';

export const getTheme = (): Theme => {
  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
};

export const toggleTheme = (): void => {
  const currentTheme = document.documentElement.getAttribute(
    'data-bs-theme'
  ) as Theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
};
