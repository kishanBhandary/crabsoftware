/**
 * Salinity adjustments for aquaculture tanks.
 * Salinity is measured in ppt (parts per thousand), which is equivalent to g/L.
 */

export interface SalinityAdjustmentResult {
  action: 'INCREASE' | 'DECREASE' | 'NONE';
  amount: number; // grams of salt to add, OR liters of freshwater to replace
  unit: string;   // 'g' or 'L'
  description: string;
}

export const SalinityCalculator = {
  /**
   * Calculate salt to add or freshwater to replace to reach a target salinity.
   */
  calculateAdjustment(
    volumeLiters: number,
    currentSalinityPpt: number,
    targetSalinityPpt: number
  ): SalinityAdjustmentResult {
    if (volumeLiters <= 0 || currentSalinityPpt < 0 || targetSalinityPpt < 0) {
      return { action: 'NONE', amount: 0, unit: '', description: 'Invalid parameters' };
    }

    const diff = targetSalinityPpt - currentSalinityPpt;

    if (Math.abs(diff) < 0.1) {
      return {
        action: 'NONE',
        amount: 0,
        unit: '',
        description: 'Salinity is already at the target level.'
      };
    }

    if (diff > 0) {
      // Need to add salt
      // 1 ppt = 1 g/L. To increase salinity by 1 ppt in 1 L, add 1 g of salt.
      const saltGrams = volumeLiters * diff;
      return {
        action: 'INCREASE',
        amount: Math.round(saltGrams * 10) / 10,
        unit: 'g',
        description: `Add ${Math.round(saltGrams).toLocaleString()} grams of marine salt to increase salinity by ${diff.toFixed(1)} ppt.`
      };
    } else {
      // Need to reduce salinity by replacing water with freshwater
      // Formula: Vr = V * (1 - St/Sc)
      if (currentSalinityPpt === 0) {
        return { action: 'NONE', amount: 0, unit: '', description: 'Current salinity is 0' };
      }
      
      const replaceLiters = volumeLiters * (1 - targetSalinityPpt / currentSalinityPpt);
      return {
        action: 'DECREASE',
        amount: Math.round(replaceLiters * 10) / 10,
        unit: 'L',
        description: `Drain and replace ${Math.round(replaceLiters).toLocaleString()} liters of tank water with fresh (0 ppt) water.`
      };
    }
  }
};
