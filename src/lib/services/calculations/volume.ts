/**
 * Tank volume calculation utilities.
 */

export const VolumeCalculator = {
  /**
   * Calculate volume of a rectangular tank in liters.
   * Input dimensions in meters.
   */
  rectangular(length: number, width: number, depth: number): number {
    if (length <= 0 || width <= 0 || depth <= 0) return 0;
    // volume in cubic meters = length * width * depth
    // 1 cubic meter = 1000 liters
    return length * width * depth * 1000;
  },

  /**
   * Calculate volume of a cylindrical tank in liters.
   * Input dimensions in meters.
   */
  cylindrical(radius: number, depth: number): number {
    if (radius <= 0 || depth <= 0) return 0;
    // volume in cubic meters = pi * radius^2 * depth
    // 1 cubic meter = 1000 liters
    return Math.PI * Math.pow(radius, 2) * depth * 1000;
  },

  /**
   * Calculate volume of a rectangular tank with dimensions in centimeters.
   */
  rectangularCm(lengthCm: number, widthCm: number, depthCm: number): number {
    if (lengthCm <= 0 || widthCm <= 0 || depthCm <= 0) return 0;
    return (lengthCm * widthCm * depthCm) / 1000;
  },

  /**
   * Calculate volume of a cylindrical tank with dimensions in centimeters.
   */
  cylindricalCm(radiusCm: number, depthCm: number): number {
    if (radiusCm <= 0 || depthCm <= 0) return 0;
    return (Math.PI * Math.pow(radiusCm, 2) * depthCm) / 1000;
  }
};
