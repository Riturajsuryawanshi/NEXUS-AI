
import { CacheRecord, DataSummary, Brain2Result } from '../types';

export class CacheService {
  private static store = new Map<string, CacheRecord>();
  private static APP_VERSION = "v1.1"; // Increment to invalidate cache when logic changes

  /**
   * Generates a deterministic SHA-256 hash based on content and parameters.
   */
  static async generateKey(content: string, aiMode: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(content + aiMode + this.APP_VERSION);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static get(key: string): CacheRecord | undefined {
    return this.store.get(key);
  }

  static set(key: string, summary: DataSummary, aiResult?: Brain2Result) {
    this.store.set(key, {
      key,
      summary,
      aiResult,
      createdAt: Date.now(),
    });
  }
}
