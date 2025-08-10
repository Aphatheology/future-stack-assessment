export class NGNCurrencyUtils {
  private static readonly KOBO_TO_NAIRA = 100;
  private static readonly CURRENCY_CODE = 'NGN';
  private static readonly CURRENCY_SYMBOL = '₦';

  /**
   * Convert Naira to Kobo (for storage)
   */
  static nairaToKobo(naira: number): bigint {
    // Handle floating point precision issues
    const kobo = Math.round(naira * this.KOBO_TO_NAIRA);
    return BigInt(kobo);
  }

  /**
   * Convert Kobo to Naira (for display)
   */
  static koboToNaira(kobo: bigint): number {
    return Number(kobo) / this.KOBO_TO_NAIRA;
  }

  /**
   * Format price for display
   */
  static formatPrice(
    kobo: bigint,
    options?: {
      showSymbol?: boolean;
      showCurrency?: boolean;
      decimals?: number;
    }
  ): string {
    const naira = this.koboToNaira(kobo);
    const { showSymbol = true, showCurrency = false, decimals = 2 } = options || {};

    let formatted = naira.toLocaleString('en-NG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (showSymbol) {
      formatted = `${this.CURRENCY_SYMBOL}${formatted}`;
    }

    if (showCurrency) {
      formatted = `${formatted} ${this.CURRENCY_CODE}`;
    }

    return formatted;
  }

  /**
   * Parse user input price string to kobo
   */
  static parsePrice(priceString: string): bigint {
    // Remove currency symbols and whitespace
    const cleaned = priceString
      .replace(/[₦,\s]/g, '')
      .replace(/NGN/gi, '')
      .trim();

    const naira = parseFloat(cleaned);

    if (isNaN(naira) || naira < 0) {
      throw new Error('Invalid price format');
    }

    return this.nairaToKobo(naira);
  }
}
