const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('🔧 Frontend usando API:', API_BASE_URL); // Debug

export function getBaseUrl() {
  // 1. SEMPRE priorizar variável de ambiente
  if (import.meta.env.VITE_API_URL) {
    // console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Se não tem variável, usar detecção (SÓ para desenvolvimento)
  // console.warn('⚠️ VITE_API_URL não definido! Usando detecção automática.');
  
  const hostname = window.location.hostname;
  
  // FORÇAR porta 3005 para produção em rede
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const baseUrl = `http://${hostname}:3005`;
    console.log('🔧 Produção detectada, usando porta 3005:', baseUrl);
    return baseUrl;
  }
  
  // Só usar 3001 para localhost
  const baseUrl = 'http://localhost:3001';
  console.log('🔧 Desenvolvimento local, usando porta 3001:', baseUrl);
  return baseUrl;
}