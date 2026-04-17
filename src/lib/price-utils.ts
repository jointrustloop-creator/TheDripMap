import { Provider } from '../types';

export interface ValueMetrics {
  score: number; // 0-100
  label: 'Value' | 'Balanced' | 'Premium';
  color: string;
  reason: string;
}

export function calculateValueMetrics(provider: Provider): ValueMetrics {
  // 1. Get price level (1-4)
  const priceLevel = provider.price_range ? provider.price_range.length : 
                    provider.priceRange ? provider.priceRange.length : 2;
  
  // 2. Get value for money driver (1-5, default 3)
  const valueForMoney = provider.decisionDrivers?.valueForMoney || 3;
  
  // 3. Calculate raw score
  // If price is low ($) and value for money is high (5), score is higher
  // Base score 50
  let score = 50;
  
  // Adjusted by price (Inverse relationship: lower price = more "value")
  score += (3 - priceLevel) * 10;
  
  // Adjusted by user-reported value
  score += (valueForMoney - 3) * 15;
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // 4. Determine label
  let label: 'Value' | 'Balanced' | 'Premium' = 'Balanced';
  let color = 'text-blue-600 bg-blue-50 border-blue-100';
  let reason = 'Solid services consistent with market rates.';
  
  if (score >= 70) {
    label = 'Value';
    color = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    reason = 'Highly competitive pricing for the quality of care.';
  } else if (score < 40) {
    label = 'Premium';
    color = 'text-amber-700 bg-amber-50 border-amber-100';
    reason = 'High-end specialized services and luxury setting.';
  }
  
  return { score, label, color, reason };
}
