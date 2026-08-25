/**
 * Formats a number as Indian Rupee (INR) currency.
 * Example: 125000 -> ₹1,25,000.00
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0.00';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Calculates row amount based on quantity and rate.
 * @param {number|string} quantity 
 * @param {number|string} rate 
 * @returns {number} Amount (qty * rate)
 */
export const calculateRowAmount = (quantity, rate) => {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  return qty * rt;
};

/**
 * Calculates totals for a list of products.
 * @param {Array} products 
 * @returns {Object} { subtotal, totalQuantity, totalAmount }
 */
export const calculateTotals = (products = []) => {
  return products.reduce(
    (acc, curr) => {
      const qty = parseFloat(curr.quantity) || 0;
      const rate = parseFloat(curr.rate) || 0;
      const amount = qty * rate;
      
      acc.totalQuantity += qty;
      acc.totalAmount += amount;
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );
};
