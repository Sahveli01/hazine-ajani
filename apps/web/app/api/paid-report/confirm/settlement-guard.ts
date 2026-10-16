export class SettlementGuard {
  readonly #claims = new Set<string>();

  async consume<T>(transactionHash: string, analysisId: string, task: () => Promise<T>) {
    const claim = `${transactionHash.toLowerCase()}:${analysisId}`;
    const transactionPrefix = `${transactionHash.toLowerCase()}:`;
    if ([...this.#claims].some((entry) => entry.startsWith(transactionPrefix))) {
      throw new Error("SETTLEMENT_REPLAY");
    }
    this.#claims.add(claim);
    try {
      return await task();
    } catch (error) {
      this.#claims.delete(claim);
      throw error;
    }
  }
}

const globalGuard = globalThis as typeof globalThis & {
  __hazineSettlementGuard?: SettlementGuard;
};

export const settlementGuard =
  globalGuard.__hazineSettlementGuard ??= new SettlementGuard();
