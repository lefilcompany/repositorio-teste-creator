// lib/cache.ts
export class CacheManager {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static set(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (error) {
      }
  }

  static get<T>(key: string): T | null {
    try {
      const cachedData = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);

      if (!cachedData || !timestamp) {
        return null;
      }

      const isExpired = Date.now() - parseInt(timestamp) > this.CACHE_DURATION;
      if (isExpired) {
        this.remove(key);
        return null;
      }

      return JSON.parse(cachedData) as T;
    } catch (error) {
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    } catch (error) {
      }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.endsWith('_timestamp') || key.startsWith('user_') || key.startsWith('team_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      }
  }

  static clearUserCache(userId: string): void {
    this.remove(`user_${userId}`);
  }

  static clearTeamCache(teamId: string): void {
    this.remove(`team_${teamId}`);
  }
}

