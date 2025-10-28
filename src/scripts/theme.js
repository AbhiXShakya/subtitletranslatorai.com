// Theme management
const initTheme = () => {
  const htmlElement = document.documentElement;

  // Function to set the theme
  const setTheme = (theme) => {
    htmlElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);

    // Update button icon visibility
    const moonIcon = document.querySelector(
      '#theme-toggle .bi-moon-stars-fill'
    );
    const sunIcon = document.querySelector('#theme-toggle .bi-sun-fill');

    if (theme === 'dark') {
      moonIcon?.classList.add('d-none');
      sunIcon?.classList.remove('d-none');
    } else {
      moonIcon?.classList.remove('d-none');
      sunIcon?.classList.add('d-none');
    }
  };

  // Get saved theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Set initial theme
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme(prefersDark ? 'dark' : 'light');
  }

  // Listen for theme toggle button clicks
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
};

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
