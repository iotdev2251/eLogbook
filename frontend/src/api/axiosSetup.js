import axios from 'axios';

axios.defaults.withCredentials = true;

let onUnauthorized = () => {};

export function configureAxios({ onUnauthorized: handler }) {
  onUnauthorized = handler;
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default axios;
