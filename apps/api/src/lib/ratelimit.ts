/** Limitation de débit derrière une interface (déplaçable plus tard hors mémoire : Redis, base...). */
export interface RateLimiter {
  /** Compte un événement ; renvoie true si la limite est dépassée. */
  hit(key: string, limit: number, windowMs: number): boolean;
  /** Nombre d'événements dans la fenêtre. */
  count(key: string, windowMs: number): number;
  reset(key: string): void;
}

export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private now: () => number = Date.now) {}
  private prune(key: string, windowMs: number): number[] {
    const t = this.now();
    const arr = (this.hits.get(key) ?? []).filter((x) => t - x < windowMs);
    this.hits.set(key, arr);
    return arr;
  }
  hit(key: string, limit: number, windowMs: number): boolean {
    const arr = this.prune(key, windowMs);
    arr.push(this.now());
    return arr.length > limit;
  }
  count(key: string, windowMs: number): number {
    return this.prune(key, windowMs).length;
  }
  reset(key: string): void {
    this.hits.delete(key);
  }
}
