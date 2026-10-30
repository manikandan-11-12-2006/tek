import React, { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowLeft, Save, Printer, Stamp } from 'lucide-react';
import { formatCurrency, calculateRowAmount, calculateTotals } from '../utils/calculations';
import { 
  generateNextChallanNumber, 
  getChallans,
  getProductSuggestions,
  addProductSuggestion,
  getCustomerSuggestions,
  addCustomerSuggestion
} from '../utils/storage';

export default function ChallanForm({ initialData, onSave, onCancel }) {
  const [customer, setCustomer] = useState(initialData?.customer || '');
  const [challanNumber, setChallanNumber] = useState(initialData?.challanNumber || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [vehicleNumber, setVehicleNumber] = useState(initialData?.vehicleNumber || '');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [includeSeal, setIncludeSeal] = useState(
    initialData?.includeSeal !== undefined ? initialData.includeSeal : true
  );
  const [products, setProducts] = useState(
    initialData?.products?.length > 0
      ? initialData.products.map(p => ({ ...p, unit: p.unit || 'nos' }))
      : [{ name: '', quantity: '', unit: 'nos', rate: '', amount: 0 }]
  );
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [existingChallans, setExistingChallans] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Handle click outside to close customer search dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.customer-search-container')) {
        setShowCustDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Initialize suggestions and default challan number (if create mode)
  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      try {
        const [suggestionsData, custListData, existingData] = await Promise.all([
          getProductSuggestions(),
          getCustomerSuggestions(),
          getChallans()
        ]);
        if (isCancelled) return;
        setSuggestions(suggestionsData || []);
        setCustomerList(custListData || []);
        setExistingChallans(existingData || []);

        if (initialData) {
          // Sync state if initialData changed
          setCustomer(initialData.customer || '');
          setChallanNumber(initialData.challanNumber || '');
          setDate(initialData.date || '');
          setVehicleNumber(initialData.vehicleNumber || '');
          setRemarks(initialData.remarks || '');
          setIncludeSeal(initialData.includeSeal !== undefined ? initialData.includeSeal : true);
          if (initialData.products?.length > 0) {
            setProducts(initialData.products.map(p => ({ ...p, unit: p.unit || 'nos' })));
          }
        } else {
          // Create mode
          const nextNo = await generateNextChallanNumber();
          if (isCancelled) return;
          setChallanNumber(prev => prev || nextNo);
          setDate(prev => prev || new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error("Error loading form dependencies:", err);
      }
    };
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [initialData]);

  // Update totals dynamically
  const { totalQuantity, totalAmount } = calculateTotals(products);

  // Filter saved customers for search autocomplete dropdown
  const filteredCustomers = customerList.filter(cust => 
    cust.toLowerCase().includes(custSearch.toLowerCase())
  );

  // Handle product row change
  const handleProductChange = (index, field, value) => {
    const updated = [...products];
    const row = { ...updated[index] };
    
    if (field === 'amount') {
      row.amount = value;
      const qty = parseFloat(row.quantity);
      const amt = parseFloat(value);
      // If quantity is already provided and > 0, calculate rate = amount / quantity
      if (!isNaN(qty) && qty > 0 && !isNaN(amt) && amt >= 0) {
        row.rate = (amt / qty).toFixed(2);
      }
    } else if (field === 'quantity') {
      row.quantity = value;
      const qty = parseFloat(value);
      const rt = parseFloat(row.rate);
      const amt = parseFloat(row.amount);
      if (!isNaN(qty) && qty > 0 && !isNaN(rt) && rt > 0) {
        row.amount = calculateRowAmount(qty, rt);
      } else if (!isNaN(qty) && qty > 0 && !isNaN(amt) && amt > 0 && (isNaN(rt) || rt === 0)) {
        row.rate = (amt / qty).toFixed(2);
      }
    } else if (field === 'rate') {
      row.rate = value;
      const qty = parseFloat(row.quantity);
      const rt = parseFloat(value);
      if (!isNaN(qty) && qty > 0 && !isNaN(rt)) {
        row.amount = calculateRowAmount(qty, rt);
      } else if ((isNaN(qty) || qty === 0) && !isNaN(rt) && rt > 0) {
        row.quantity = '1';
        row.amount = calculateRowAmount(1, rt);
      }
    } else {
      row[field] = value;
    }
    
    updated[index] = row;
    setProducts(updated);
    
    // Clear validation error on change
    if (touched) {
      validateForm(updated, customer, challanNumber, date);
    }
  };

  // Add new product row
  const addProductRow = () => {
    setProducts([...products, { name: '', quantity: '', unit: 'nos', rate: '', amount: '' }]);
  };

  // Delete product row
  const removeProductRow = (index) => {
    const updated = products.filter((_, i) => i !== index);
    // Keep at least one row
    if (updated.length === 0) {
      setProducts([{ name: '', quantity: '', unit: 'nos', rate: '', amount: '' }]);
      if (touched) validateForm([{ name: '', quantity: '', unit: 'nos', rate: '', amount: '' }], customer, challanNumber, date);
    } else {
      setProducts(updated);
      if (touched) validateForm(updated, customer, challanNumber, date);
    }
  };

  // Form Validation
  const validateForm = (prodList = products, cust = customer, dcNo = challanNumber, dt = date, forceShowEmpty = touched) => {
    const tempErrors = {};

    if (!cust.trim() && forceShowEmpty) {
      tempErrors.customer = 'Receiver (Customer) details are required';
    }
    
    if (!dcNo.trim()) {
      if (forceShowEmpty) {
        tempErrors.challanNumber = 'Challan number is required';
      }
    } else {
      // Check for duplicate in loaded challans (exclude current challan in Edit mode)
      const isDuplicate = existingChallans.some(c => 
        c.challanNumber.toLowerCase().trim() === dcNo.toLowerCase().trim() && 
        (!initialData || c.id !== initialData.id)
      );
      if (isDuplicate) {
        tempErrors.challanNumber = 'DC number already exists';
      }
    }

    if (!dt && forceShowEmpty) {
      tempErrors.date = 'Date is required';
    }

    // Filter out rows that are entirely empty before validating
    const nonEmptyRows = prodList.filter(p => 
      p.name.trim() || p.quantity || p.rate || (p.amount !== '' && p.amount !== undefined && p.amount !== 0)
    );
    
    if (nonEmptyRows.length === 0 && forceShowEmpty) {
      tempErrors.products = 'At least one product item is required';
    } else if (nonEmptyRows.length > 0) {
      const productErrors = [];
      prodList.forEach((prod, idx) => {
        const rowErrors = {};
        
        // If the row has any input, it must be validated
        const hasAnyInput = prod.name.trim() || prod.quantity || prod.rate || (prod.amount !== '' && prod.amount !== undefined);
        if (hasAnyInput) {
          if (!prod.name.trim()) {
            rowErrors.name = 'Product name required';
          }
          
          const qty = parseFloat(prod.quantity);
          const rate = parseFloat(prod.rate);
          const amt = parseFloat(prod.amount);
          
          if (prod.quantity !== '' && prod.quantity !== undefined) {
            if (isNaN(qty) || qty < 0) {
              rowErrors.quantity = 'Must be ≥ 0';
            }
          }
          
          if (prod.rate !== '' && prod.rate !== undefined) {
            if (isNaN(rate) || rate < 0) {
              rowErrors.rate = 'Cannot be negative';
            }
          }

          if (prod.amount !== '' && prod.amount !== undefined) {
            if (isNaN(amt) || amt < 0) {
              rowErrors.amount = 'Cannot be negative';
            }
          }

          const hasValidAmt = !isNaN(amt) && amt >= 0 && prod.amount !== '' && prod.amount !== undefined;
          const hasValidQtyRate = !isNaN(qty) && qty > 0 && !isNaN(rate) && rate >= 0;
          if (!hasValidAmt && !hasValidQtyRate) {
            rowErrors.amount = 'Enter Amount or Qty & Rate';
          }
        }
        
        if (Object.keys(rowErrors).length > 0) {
          productErrors[idx] = rowErrors;
        }
      });
      
      if (productErrors.length > 0) {
        tempErrors.productRows = productErrors;
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Save
  const handleSubmit = (e, printAfterSave = false) => {
    e.preventDefault();
    setTouched(true);
    
    const isValid = validateForm(products, customer, challanNumber, date, true);
    if (!isValid) {
      alert("Please fix the validation errors in the form before saving.");
      return;
    }

    // Filter empty rows and clean product list
    const cleanedProducts = products
      .filter(p => {
        const hasName = p.name && p.name.trim().length > 0;
        const hasAmt = p.amount !== '' && p.amount !== undefined && !isNaN(parseFloat(p.amount)) && parseFloat(p.amount) >= 0;
        const hasQtyRate = parseFloat(p.quantity) > 0 && parseFloat(p.rate) >= 0;
        return hasName && (hasAmt || hasQtyRate);
      })
      .map((p, idx) => {
        const qty = parseFloat(p.quantity) || 0;
        const rt = parseFloat(p.rate) || 0;
        const amt = (p.amount !== '' && p.amount !== undefined && !isNaN(parseFloat(p.amount)))
          ? parseFloat(p.amount)
          : (qty * rt);

        return {
          serialNumber: idx + 1,
          name: p.name.trim(),
          quantity: qty,
          unit: p.unit || 'nos',
          rate: rt,
          amount: parseFloat(amt)
        };
      });

    // Save newly entered product names to suggestions database
    cleanedProducts.forEach(p => {
      addProductSuggestion(p.name);
    });

    // Save newly entered customer details to suggestions database
    if (customer.trim()) {
      addCustomerSuggestion(customer);
    }

    const finalChallan = {
      customer: customer.trim(),
      challanNumber: challanNumber.trim(),
      date,
      vehicleNumber: vehicleNumber.trim(),
      remarks: remarks.trim(),
      products: cleanedProducts,
      totalQuantity,
      totalAmount,
      includeSeal,
    };

    onSave(finalChallan, printAfterSave);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Form header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData ? `Edit Challan: ${initialData.challanNumber || challanNumber}` : 'New Delivery Challan Details'}
            </h2>
            <p className="text-xs text-slate-500">Fill in client information and items to generate challan</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Customer and General Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer address */}
            <div className="lg:col-span-2 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="customer" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  To (Customer Details) <span className="text-red-500">*</span>
                </label>
                {customerList.length > 0 && (
                  <div className="relative customer-search-container">
                    <input
                      type="text"
                      placeholder="🔍 Search saved customer..."
                      value={custSearch}
                      onFocus={() => setShowCustDropdown(true)}
                      onChange={(e) => {
                        setCustSearch(e.target.value);
                        setShowCustDropdown(true);
                      }}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-bold transition-all outline-none focus:bg-white focus:border-blue-500 w-44 lg:w-52 cursor-text"
                    />
                    
                    {showCustDropdown && (
                      <div className="absolute right-0 mt-1 z-50 w-72 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto font-sans text-xs">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-slate-400 italic text-center">
                            No matching customers found
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredCustomers.map((cust, idx) => {
                              const lines = cust.split('\n');
                              const companyName = lines[0] || cust;
                              const subtext = lines.slice(1).join(', ').substring(0, 50) + (lines.length > 1 ? '...' : '');
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setCustomer(cust);
                                    validateForm(products, cust, challanNumber, date);
                                    setCustSearch('');
                                    setShowCustDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-md transition-colors flex flex-col gap-0.5 cursor-pointer border-b border-slate-50 last:border-none"
                                >
                                  <span className="font-extrabold text-slate-800 truncate">{companyName}</span>
                                  {subtext && <span className="text-[10px] text-slate-400 font-medium truncate">{subtext}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <textarea
                id="customer"
                rows="4"
                placeholder="Client / Company Name&#10;Full Address, Street details&#10;City, Pincode"
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  if (touched) validateForm(products, e.target.value, challanNumber, date);
                }}
                className={`w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border ${
                  errors.customer ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                } rounded-lg resize-y focus:bg-white`}
              ></textarea>
              {errors.customer && (
                <p className="text-xs font-bold text-red-600 mt-0.5">{errors.customer}</p>
              )}
            </div>

            {/* Challan Metadata */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="challanNumber" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  DC Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="challanNumber"
                  type="text"
                  placeholder="TEK-XXXX"
                  value={challanNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChallanNumber(val);
                    validateForm(products, customer, val, date);
                  }}
                  className={`w-full text-sm font-bold px-4 py-2.5 bg-slate-50 border ${
                    errors.challanNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                  } rounded-lg focus:bg-white`}
                />
                {errors.challanNumber && (
                  <p className="text-xs font-bold text-red-600 mt-0.5">{errors.challanNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="date" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (touched) validateForm(products, customer, challanNumber, e.target.value);
                  }}
                  className={`w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border ${
                    errors.date ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                  } rounded-lg focus:bg-white`}
                />
                {errors.date && (
                  <p className="text-xs font-bold text-red-600 mt-0.5">{errors.date}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="vehicleNumber" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Vehicle No
                </label>
                <input
                  id="vehicleNumber"
                  type="text"
                  placeholder="e.g. TN 38 AA 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full text-sm font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Products Entry Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Products / Materials List <span className="text-red-500">*</span>
              </label>
              {errors.products && (
                <p className="text-xs font-bold text-red-600">{errors.products}</p>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="py-3 px-4 w-[5%] text-center">S.No</th>
                      <th className="py-3 px-4 w-[45%]">Product Name</th>
                      <th className="py-3 px-4 w-[16%] text-right">Quantity</th>
                      <th className="py-3 px-4 w-[14%] text-right">Rate (₹)</th>
                      <th className="py-3 px-4 w-[14%] text-right">Amount (₹)</th>
                      <th className="py-3 px-4 w-[6%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod, index) => {
                      const rowError = errors.productRows?.[index] || {};
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          {/* S.No */}
                          <td className="py-3 px-4 text-center text-sm font-semibold text-slate-400 font-mono">
                            {index + 1}
                          </td>

                          {/* Product Name Input with Datalist suggestions */}
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              list={`suggestions-${index}`}
                              placeholder="e.g. APFC Panel, Control Panel, etc."
                              value={prod.name}
                              onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                              className={`w-full text-sm font-medium px-3 py-1.5 bg-slate-50 border ${
                                rowError.name ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                              } rounded-lg`}
                            />
                            <datalist id={`suggestions-${index}`}>
                              {suggestions.map((item, key) => (
                                <option key={key} value={item} />
                              ))}
                            </datalist>
                            {rowError.name && (
                              <p className="text-[10px] font-bold text-red-600 mt-0.5">{rowError.name}</p>
                            )}
                          </td>

                          {/* Quantity Input */}
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0"
                                value={prod.quantity}
                                onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                className={`w-16 text-right text-sm font-medium px-2 py-1.5 bg-slate-50 border ${
                                  rowError.quantity ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                                } rounded-lg font-mono`}
                              />
                              <select
                                value={prod.unit}
                                onChange={(e) => handleProductChange(index, 'unit', e.target.value)}
                                className="text-xs font-medium px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none"
                              >
                                <option value="nos">nos</option>
                                <option value="set">set</option>
                                <option value="pcs">pcs</option>
                                <option value="kgs">kgs</option>
                              </select>
                            </div>
                            {rowError.quantity && (
                              <p className="text-[10px] font-bold text-red-600 mt-0.5 text-right">{rowError.quantity}</p>
                            )}
                          </td>

                          {/* Rate Input */}
                          <td className="py-2.5 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={prod.rate}
                              onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                              className={`w-28 text-right text-sm font-medium px-3 py-1.5 bg-slate-50 border ${
                                rowError.rate ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                              } rounded-lg font-mono`}
                            />
                            {rowError.rate && (
                              <p className="text-[10px] font-bold text-red-600 mt-0.5">{rowError.rate}</p>
                            )}
                          </td>

                          {/* Amount Column */}
                          <td className="py-2.5 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={prod.amount !== undefined ? prod.amount : ''}
                              onChange={(e) => handleProductChange(index, 'amount', e.target.value)}
                              className={`w-28 text-right text-sm font-medium px-3 py-1.5 bg-slate-50 border ${
                                rowError.amount ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                              } rounded-lg font-mono focus:bg-white`}
                            />
                            {rowError.amount && (
                              <p className="text-[10px] font-bold text-red-600 mt-0.5 text-right">{rowError.amount}</p>
                            )}
                          </td>

                          {/* Delete row */}
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeProductRow(index)}
                              className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add row & Totals row */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={addProductRow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  Add Product
                </button>

                <div className="flex gap-8 text-right self-stretch md:self-auto justify-end">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Quantity</span>
                    <span className="text-base font-bold text-slate-800 font-mono">{totalQuantity}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                    <span className="text-lg font-black text-blue-900 font-mono">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Remarks / Description */}
          <div className="space-y-1">
            <label htmlFor="remarks" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Remarks / Description (Optional)
            </label>
            <textarea
              id="remarks"
              rows="3"
              placeholder="Add any extra notes or terms here..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg resize-y focus:bg-white"
            ></textarea>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Company Seal & Stamp Option */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${includeSeal ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                <Stamp size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Company Seal & Stamp</div>
                <div className="text-[11px] text-slate-500">Attach official TEKPOWER seal to this bill</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeSeal(!includeSeal)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeSeal ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={includeSeal}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  includeSeal ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Printer size={16} />
            Save & Print
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Save size={16} />
            Save Challan
          </button>
        </div>
      </div>
    </form>
  );
}
