import { sampleChallans, defaultCompanyDetails } from '../data/sampleData';

const CHALLANS_KEY = 'tekpower_challans';
const COMPANY_KEY = 'tekpower_company_details';

/**
 * Initialize storage with default data if empty.
 */
export const initStorage = () => {
  if (!localStorage.getItem(CHALLANS_KEY)) {
    localStorage.setItem(CHALLANS_KEY, JSON.stringify(sampleChallans));
  }
  if (!localStorage.getItem(COMPANY_KEY)) {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(defaultCompanyDetails));
  }
};

/**
 * Retrieves all challans. Seeds first if empty.
 * @returns {Array} List of challans
 */
export const getChallans = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(CHALLANS_KEY)) || [];
  } catch (error) {
    console.error("Error reading challans from localStorage:", error);
    return [];
  }
};

/**
 * Saves the full list of challans to localStorage.
 * @param {Array} challans 
 */
export const saveChallans = (challans) => {
  localStorage.setItem(CHALLANS_KEY, JSON.stringify(challans));
};

/**
 * Fetches a single challan by its ID.
 * @param {string} id 
 * @returns {Object|null} The challan object or null
 */
export const getChallanById = (id) => {
  const challans = getChallans();
  return challans.find(c => c.id === id) || null;
};

/**
 * Finds the highest numerical value in current challan numbers (TEK-XXXX)
 * and generates the next incremented code.
 * @returns {string} Next challan number (e.g. TEK-0004)
 */
export const generateNextChallanNumber = () => {
  const challans = getChallans();
  let maxNum = 0;
  
  challans.forEach(c => {
    if (c.challanNumber) {
      // Look for TEK- followed by numbers
      const match = c.challanNumber.match(/TEK-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });
  
  const nextNum = maxNum + 1;
  return `TEK-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Saves a new challan.
 * @param {Object} challan 
 * @returns {Object} The created challan
 */
export const createChallan = (challan) => {
  const challans = getChallans();
  
  const newChallan = {
    ...challan,
    id: challan.id || `tek-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  challans.push(newChallan);
  saveChallans(challans);
  return newChallan;
};

/**
 * Updates an existing challan by ID.
 * @param {string} id 
 * @param {Object} updatedData 
 * @returns {Object|null} The updated challan or null
 */
export const updateChallan = (id, updatedData) => {
  const challans = getChallans();
  const index = challans.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const updatedChallan = {
    ...challans[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };
  
  challans[index] = updatedChallan;
  saveChallans(challans);
  return updatedChallan;
};

/**
 * Deletes a challan by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found
 */
export const deleteChallan = (id) => {
  const challans = getChallans();
  const filtered = challans.filter(c => c.id !== id);
  
  if (filtered.length === challans.length) return false;
  
  saveChallans(filtered);
  return true;
};

/**
 * Duplicates a challan, generating a new ID, next challan number, and current date.
 * @param {string} id 
 * @returns {Object|null} The new duplicated challan
 */
export const duplicateChallan = (id) => {
  const original = getChallanById(id);
  if (!original) return null;
  
  const nextNumber = generateNextChallanNumber();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const copy = {
    ...original,
    id: `tek-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    challanNumber: nextNumber,
    date: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return createChallan(copy);
};

/**
 * Retrieves the company details profile.
 * @returns {Object} Company details
 */
export const getCompanyDetails = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(COMPANY_KEY)) || defaultCompanyDetails;
  } catch (error) {
    console.error("Error reading company details:", error);
    return defaultCompanyDetails;
  }
};

/**
 * Updates the company details profile.
 * @param {Object} details 
 */
export const saveCompanyDetails = (details) => {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(details));
};
