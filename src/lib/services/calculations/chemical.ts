/**
 * Chemical dosing calculation engine for aquaculture systems.
 */

export interface ChemicalDoseResult {
  chemicalName: string;
  amount: number; // in grams
  unit: string;
  description: string;
}

export const ChemicalCalculator = {
  /**
   * Calculate Sodium Bicarbonate (NaHCO3) needed to raise pH.
   * General rule of thumb: ~20g per 1000L of water is required to increase pH by 0.1
   * in typical marine/brackish environments (adjusts alkalinity by ~0.15 meq/L).
   */
  calculatePhBuffer(volumeLiters: number, currentPh: number, targetPh: number): ChemicalDoseResult {
    if (volumeLiters <= 0 || currentPh <= 0 || targetPh <= 0 || targetPh <= currentPh) {
      return {
        chemicalName: 'Sodium Bicarbonate (NaHCO3)',
        amount: 0,
        unit: 'g',
        description: 'No adjustment needed or invalid pH values.'
      };
    }

    const diff = targetPh - currentPh;
    // 20g per 1000L per 0.1 pH
    const dosage = (diff / 0.1) * 20 * (volumeLiters / 1000);

    return {
      chemicalName: 'Sodium Bicarbonate (NaHCO3)',
      amount: Math.round(dosage * 10) / 10,
      unit: 'g',
      description: `Add ${Math.round(dosage).toLocaleString()}g of Sodium Bicarbonate to raise pH by ${diff.toFixed(2)} units (target: ${targetPh}).`
    };
  },

  /**
   * Calculate carbon source dosage (e.g. Molasses) to assimilate ammonia in Biofloc systems.
   * Based on C:N ratio adjustment.
   * Standard biofloc rule: 15.6g of Carbon is needed to assimilate 1g of Ammonia-Nitrogen.
   * Molasses is approximately 50% Carbon by weight.
   * C:N Ratio is typically targetted at 15:1 or 20:1.
   */
  calculateBioflocCarbonSource(
    volumeLiters: number,
    ammoniaPpm: number,
    targetCnRatio: number = 15
  ): ChemicalDoseResult {
    if (volumeLiters <= 0 || ammoniaPpm <= 0) {
      return {
        chemicalName: 'Molasses (Carbon Source)',
        amount: 0,
        unit: 'g',
        description: 'No carbon dosing required or ammonia level is zero.'
      };
    }

    // Ammonia-N (g) = ammoniaPpm (mg/L) * volumeLiters / 1000 (L to m3) * 1000 (mg to g conversion cancel out)
    // Actually, mg/L * L = mg. So Ammonia (mg) = ammoniaPpm * volumeLiters.
    // Convert to grams: Ammonia (g) = (ammoniaPpm * volumeLiters) / 1000.
    const ammoniaGrams = (ammoniaPpm * volumeLiters) / 1000;

    // Carbon required (g) = Ammonia-N (g) * targetCnRatio
    const carbonGrams = ammoniaGrams * targetCnRatio;

    // Molasses weight = Carbon required / carbon content of molasses (approx 50%)
    const molassesGrams = carbonGrams / 0.5;

    return {
      chemicalName: 'Molasses',
      amount: Math.round(molassesGrams * 10) / 10,
      unit: 'g',
      description: `Dose ${Math.round(molassesGrams).toLocaleString()}g of molasses to establish a C:N ratio of ${targetCnRatio}:1 and assimilate ${ammoniaGrams.toFixed(2)}g of Ammonia.`
    };
  },

  /**
   * Calculate Chlorine dosage for tank disinfection.
   * Standard rate: 10 ppm (mg/L) of active Chlorine for disinfection before stocking.
   * Bleach powder (Calcium Hypochlorite) is typically 65% active chlorine.
   * Bleach liquid (Sodium Hypochlorite) is typically 5.25% or 10% active chlorine.
   */
  calculateChlorineDisinfection(
    volumeLiters: number,
    targetPpm: number = 10,
    chlorinePercentage: number = 65 // standard calcium hypochlorite
  ): ChemicalDoseResult {
    if (volumeLiters <= 0 || targetPpm <= 0 || chlorinePercentage <= 0) {
      return {
        chemicalName: 'Calcium Hypochlorite (65%)',
        amount: 0,
        unit: 'g',
        description: 'Invalid input parameters.'
      };
    }

    // Total active chlorine needed in grams = (targetPpm * volumeLiters) / 1000
    const activeChlorineGrams = (targetPpm * volumeLiters) / 1000;

    // Total powder required = active chlorine / (percentage / 100)
    const powderGrams = activeChlorineGrams / (chlorinePercentage / 100);

    return {
      chemicalName: `Calcium Hypochlorite (${chlorinePercentage}%)`,
      amount: Math.round(powderGrams * 10) / 10,
      unit: 'g',
      description: `Add ${Math.round(powderGrams).toLocaleString()}g of Calcium Hypochlorite to achieve ${targetPpm} ppm active chlorine disinfection.`
    };
  }
};
