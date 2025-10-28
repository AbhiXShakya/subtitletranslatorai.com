interface Toast extends bootstrap.Toast {
  show(): void;
}

declare global {
  interface Window {
    bootstrap: {
      Toast: new (element: Element, options?: any) => Toast;
    };
    showToast: (message: string, type?: ToastType) => void;
  }
}

type ToastType = 'success' | 'error' | 'warn';

const toastClasses = {
  success: 'bg-success text-light',
  error: 'bg-danger text-light',
  warn: 'bg-warning text-dark',
};

let toastContainer: HTMLElement | null = null;

const createToastContainer = (): HTMLElement => {
  toastContainer = document.createElement('div');
  toastContainer.className =
    'toast-container position-fixed bottom-0 end-0 p-3';
  toastContainer.style.zIndex = '1050';
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const createToastElement = (
  message: string,
  type: ToastType = 'success'
): HTMLElement => {
  const toastElement = document.createElement('div');
  toastElement.className = `toast ${toastClasses[type]} notranslate`;
  toastElement.setAttribute('role', 'alert');
  toastElement.setAttribute('aria-live', 'assertive');
  toastElement.setAttribute('aria-atomic', 'true');

  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body notranslate">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  return toastElement;
};

export const showToast = (
  message: string,
  type: ToastType = 'success'
): void => {
  if (!toastContainer) {
    toastContainer =
      document.querySelector('.toast-container') || createToastContainer();
  }

  const toastElement = createToastElement(message, type);
  toastContainer.appendChild(toastElement);

  const toast = new window.bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000,
  });

  // Remove toast element from DOM after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });

  toast.show();
};

// Initialize toast functionality
export const initToasts = (): void => {
  window.showToast = showToast;
};
