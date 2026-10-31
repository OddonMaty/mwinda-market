export const PLAN_COMMISSION: Record<string, number> = {
  starter: 0.05, // 5%
  pro: 0.03,     // 3%
  elite: 0.02,   // 2%
};

export function getCommissionRate(plan: string): number {
  return PLAN_COMMISSION[plan] ?? PLAN_COMMISSION.starter;
}

export function calculateCommission(amountUsd: number, plan: string) {
  const rate = getCommissionRate(plan);
  const commissionUsd = Math.round(amountUsd * rate * 100) / 100;
  const vendorEarningUsd = Math.round((amountUsd - commissionUsd) * 100) / 100;
  return { rate, commissionUsd, vendorEarningUsd };
}
