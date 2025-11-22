/**
 * Format currency amount with locale and currency
 *
 * @param amount - The amount to format
 * @param locale - The locale to use (default: 'vi-VN')
 * @param currency - The currency code (default: 'VND')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale = 'vi-VN',
  currency = 'VND'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}
