import axios from 'axios';

// Função para obter a URL base dinamicamente
export const getBaseUrl = (): string => {
  const currentHost = window.location.hostname;
  
  // Se estiver acessando localmente, use o IP local
  if (currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '192.168.0.32') {
    return 'http://192.168.0.32:3005';
  }
  
  // Se estiver acessando pelo domínio externo, use o domínio externo
  if (currentHost === 'pooltecnica.no-ip.biz') {
    return 'http://pooltecnica.no-ip.biz:3005';
  }
  
  // Fallback - tente usar o mesmo protocolo e host, apenas mudando a porta
  const protocol = window.location.protocol;
  return `${protocol}//${currentHost}:3005`;
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
