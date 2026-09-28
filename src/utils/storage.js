import { ref, get, set, update, remove, child, push } from "firebase/database";
import { database } from "./firebase";
import { defaultCompanyDetails } from '../data/sampleData';

// --- CUSTOMERS ---
export const getCustomerSuggestions = async () => {
  try {
    const snapshot = await get(ref(database, 'customers'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    const defaults = [
      "LARSEN & TOUBRO LIMITED\nGate No. 3, Powai Campus,\nSaki Vihar Road, Mumbai - 400072\nGSTIN: 27AAACL1234H1Z1\nMobile No: 9876543210",
      "SIEMENS LTD\nThane Belapur Road,\nKalwa, Thane - 400601\nGSTIN: 27AAACS5678B2Z2\nMobile No: 8765432109"
    ];
    await set(ref(database, 'customers'), defaults);
    return defaults;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

export const addCustomerSuggestion = async (customerDetails) => {
  if (!customerDetails || !customerDetails.trim()) return;
  const customers = await getCustomerSuggestions();
  const trimmed = customerDetails.trim();
  const normalizedNew = trimmed.toLowerCase().replace(/\s+/g, ' ');
  
  const exists = customers.some(item => 
    item.toLowerCase().replace(/\s+/g, ' ') === normalizedNew
  );
  
  if (!exists) {
    customers.push(trimmed);
    await set(ref(database, 'customers'), customers);
  }
};

// --- PRODUCTS ---
export const getProductSuggestions = async () => {
  try {
    const snapshot = await get(ref(database, 'products'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    const defaults = [
      "Control Panel", "Capacitor Bank", "APFC Panel", "MCC Panel",
      "Electrical Components", "Spare Parts Kit", "AMF Panel", 
      "Changeover Switch Panel", "Energy Meter Panel"
    ];
    await set(ref(database, 'products'), defaults);
    return defaults;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const addProductSuggestion = async (name) => {
  if (!name || !name.trim()) return;
  const suggestions = await getProductSuggestions();
  const trimmedName = name.trim();
  const exists = suggestions.some(item => item.toLowerCase() === trimmedName.toLowerCase());
  if (!exists) {
    suggestions.push(trimmedName);
    await set(ref(database, 'products'), suggestions);
  }
};

// --- CHALLANS ---
export const getChallans = async () => {
  try {
    const snapshot = await get(ref(database, 'challans'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting challans:", error);
    return [];
  }
};

export const getChallanById = async (id) => {
  try {
    const snapshot = await get(ref(database, `challans/${id}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting challan by ID:", error);
    return null;
  }
};

export const generateNextChallanNumber = async () => {
  const challans = await getChallans();
  const existingNums = new Set();
  challans.forEach(c => {
    if (c.challanNumber) {
      const match = c.challanNumber.match(/TEK-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          existingNums.add(num);
        }
      }
    }
  });
  
  let nextNum = 1;
  while (existingNums.has(nextNum)) {
    nextNum++;
  }
  
  return `TEK-${String(nextNum).padStart(4, '0')}`;
};

export const createChallan = async (challan) => {
  const newId = challan.id || `tek-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newChallan = {
    ...challan,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await set(ref(database, `challans/${newId}`), newChallan);
  return newChallan;
};

export const updateChallan = async (id, updatedData) => {
  const challanRef = ref(database, `challans/${id}`);
  const snapshot = await get(challanRef);
  if (!snapshot.exists()) return null;

  const currentData = snapshot.val();
  const newData = {
    ...currentData,
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  await update(challanRef, newData);
  return newData;
};

// --- RECYCLE BIN / DELETE ---
export const deleteChallan = async (id) => {
  const challan = await getChallanById(id);
  if (!challan) return false;

  // Move to recycle bin
  const deletedAt = new Date().toISOString();
  await set(ref(database, `recycle_bin/${id}`), { ...challan, deletedAt });
  
  // Remove from main challans
  await remove(ref(database, `challans/${id}`));
  return true;
};

export const getRecycleBin = async () => {
  try {
    const snapshot = await get(ref(database, 'recycle_bin'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Error getting recycle bin:", error);
    return [];
  }
};

export const restoreChallan = async (id) => {
  try {
    const snapshot = await get(ref(database, `recycle_bin/${id}`));
    if (!snapshot.exists()) return false;
    
    const challanData = snapshot.val();
    delete challanData.deletedAt; // remove deletedAt flag
    
    // Put back into challans
    await set(ref(database, `challans/${id}`), challanData);
    
    // Remove from recycle bin
    await remove(ref(database, `recycle_bin/${id}`));
    return true;
  } catch (error) {
    console.error("Error restoring challan:", error);
    return false;
  }
};

export const permanentDeleteChallan = async (id) => {
  await remove(ref(database, `recycle_bin/${id}`));
  return true;
};

// --- MISC ---
export const duplicateChallan = async (id) => {
  const original = await getChallanById(id);
  if (!original) return null;
  
  const nextNumber = await generateNextChallanNumber();
  const today = new Date().toISOString().split('T')[0];
  
  const copy = {
    ...original,
    id: `tek-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    challanNumber: nextNumber,
    date: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await set(ref(database, `challans/${copy.id}`), copy);
  return copy;
};

export const getCompanyDetails = async () => {
  try {
    const snapshot = await get(ref(database, 'companyDetails'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    await set(ref(database, 'companyDetails'), defaultCompanyDetails);
    return defaultCompanyDetails;
  } catch (error) {
    console.error("Error getting company details:", error);
    return defaultCompanyDetails;
  }
};

export const saveCompanyDetails = async (details) => {
  await set(ref(database, 'companyDetails'), details);
};
