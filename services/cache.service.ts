import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@stridesync:cache:';
const KEYS_REGISTRY = '@stridesync:cache_keys';

export const cacheService = {
  /**
   * Obtém um item do cache (Memória -> AsyncStorage)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = CACHE_PREFIX + key;
      const raw = await AsyncStorage.getItem(fullKey);
      if (!raw) return null;

      const { data, expiresAt } = JSON.parse(raw);

      // Verifica expiração
      if (Date.now() > expiresAt) {
        await this.invalidate(key);
        return null;
      }

      return data as T;
    } catch (e) {
      console.warn(`[CacheService] Erro ao ler key ${key}:`, e);
      return null;
    }
  },

  /**
   * Salva um item no cache com TTL (padrão 5 minutos)
   */
  async set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    try {
      const fullKey = CACHE_PREFIX + key;
      const expiresAt = Date.now() + ttlMs;
      
      // Salva dado
      await AsyncStorage.setItem(fullKey, JSON.stringify({ data, expiresAt }));
      
      // Registra a chave para invalidação eficiente posterior
      const rawKeys = await AsyncStorage.getItem(KEYS_REGISTRY);
      let keys: string[] = rawKeys ? JSON.parse(rawKeys) : [];
      
      if (!keys.includes(key)) {
        keys.push(key);
        
        // AUTO-CLEANUP: Se tivermos muitas chaves, limpamos as mais antigas (FIFO simples)
        // Isso evita que o KEYS_REGISTRY cresça demais.
        if (keys.length > 50) {
          const toRemove = keys.shift();
          if (toRemove) await AsyncStorage.removeItem(CACHE_PREFIX + toRemove);
        }

        await AsyncStorage.setItem(KEYS_REGISTRY, JSON.stringify(keys));
      }
    } catch (e) {
      console.warn(`[CacheService] Erro ao salvar key ${key}:`, e);
    }
  },

  /**
   * Remove itens específicos ou limpa todo o cache do app
   */
  async invalidate(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        const rawKeys = await AsyncStorage.getItem(KEYS_REGISTRY);
        if (rawKeys) {
          const keys = JSON.parse(rawKeys).filter((k: string) => k !== key);
          await AsyncStorage.setItem(KEYS_REGISTRY, JSON.stringify(keys));
        }
      } else {
        const rawKeys = await AsyncStorage.getItem(KEYS_REGISTRY);
        if (rawKeys) {
          const keys = JSON.parse(rawKeys);
          const fullKeys = keys.map((k: string) => CACHE_PREFIX + k);
          await AsyncStorage.multiRemove(fullKeys);
          await AsyncStorage.removeItem(KEYS_REGISTRY);
        }
      }
    } catch (e) {
      console.warn('[CacheService] Erro ao invalidar cache:', e);
    }
  }
};
