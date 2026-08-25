import axios from 'axios';

// Função para obter a URL base dinamicamente
export const getBaseUrl = (): string => {
  // Build de produção (Docker/nginx): sempre mesma origem.
  // /api e /uploads são proxied pelo nginx → backend na rede Docker.
  // Serve LAN (IP:5173) e externo (no-ip:5173) sem CORS nem porta da API aberta.
  if (import.meta.env.PROD) {
    return "";
  }
  return import.meta.env.VITE_API_BASE_URL || "http://192.168.0.32:3030";
};

// Usar variável de ambiente com fallback
const baseURL = getBaseUrl();

export const apiBase = axios.create({
  baseURL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug para verificar a URL
console.log('🌐 API Base URL:', baseURL);

// Interceptor para logs (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  apiBase.interceptors.request.use(
    (config) => {
      console.log('📤 Requisição:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('❌ Erro na requisição:', error);
      return Promise.reject(error);
    }
  );

  apiBase.interceptors.response.use(
    (response) => {
      console.log('📥 Resposta:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ Erro na resposta:', error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// Exportar também como default para compatibilidade
export default apiBase;
  