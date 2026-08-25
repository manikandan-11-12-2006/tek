import React, { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowLeft, Save, Printer } from 'lucide-react';
import { formatCurrency, calculateRowAmount, calculateTotals } from '../utils/calculations';
import { generateNextChallanNumber } from '../utils/storage';

const PRODUCT_SUGGESTIONS = [
  "Control Panel",
  "Capacitor Bank",
  "APFC Panel",
  "MCC Panel",
  "Electrical Components",
  "Spare Parts Kit",
  "AMF Panel",
  "Changeover Switch Panel",
  "Energy Meter Panel"
];

export default function ChallanForm({ initialData, onSave, onCancel }) {
  const [customer, setCustomer] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [date, setDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [products, setProducts] = useState([
    { name: '', quantity: '', unit: 'nos', rate: '', amount: 0 }
  ]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  // Initialize form with initialData or default values
  useEffect(() => {
    if (initialData) {
      setCustomer(initialData.customer || '');
      setChallanNumber(initialData.challanNumber || '');
      setDate(initialData.date || '');
      setVehicleNumber(initialData.vehicleNumber || '');
      setRemarks(initialData.remarks || '');
      
      const loadedProducts = (initialData.products || [{ name: '', quantity: '', rate: '', amount: 0 }]).map(p => ({
        ...p,
        unit: p.unit || 'nos'
      }));
      setProducts(loadedProducts);
    } else {
      // Create mode
      setChallanNumber(generateNextChallanNumber());
      setDate(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    }
  }, [initialData]);

  // Update totals dynamically
  const { totalQuantity, totalAmount } = calculateTotals(products);

  // Handle product row change
  const handleProductChange = (index, field, value) => {
    const updated = [...products];
    const row = { ...updated[index] };
    
    if (field === 'quantity' || field === 'rate') {
      row[field] = value;
      // Calculate row amount
      row.amount = calculateRowAmount(row.quantity, row.rate);
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
    setProducts([...products, { name: '', quantity: '', unit: 'nos', rate: '', amount: 0 }]);
  };

  // Delete product row
  const removeProductRow = (index) => {
    const updated = products.filter((_, i) => i !== index);
    // Keep at least one row
    if (updated.length === 0) {
      setProducts([{ name: '', quantity: '', unit: 'nos', rate: '', amount: 0 }]);
      if (touched) validateForm([{ name: '', quantity: '', unit: 'nos', rate: '', amount: 0 }], customer, challanNumber, date);
    } else {
      setProducts(updated);
      if (touched) validateForm(updated, customer, challanNumber, date);
    }
  };

  // Form Validation
  const validateForm = (prodList = products, cust = customer, dcNo = challanNumber, dt = date) => {
    const tempErrors = {};

    if (!cust.trim()) {
      tempErrors.customer = 'Receiver (Customer) details are required';
    }
    if (!dcNo.trim()) {
      tempErrors.challanNumber = 'Challan number is required';
    }
    if (!dt) {
      tempErrors.date = 'Date is required';
    }

    // Filter out rows that are entirely empty before validating
    const nonEmptyRows = prodList.filter(p => p.name.trim() || p.quantity || p.rate);
    
    if (nonEmptyRows.length === 0) {
      tempErrors.products = 'At least one product item is required';
    } else {
      const productErrors = [];
      prodList.forEach((prod, idx) => {
        const rowErrors = {};
        
        // If the row has any input, it must be fully validated
        if (prod.name.trim() || prod.quantity || prod.rate) {
          if (!prod.name.trim()) {
            rowErrors.name = 'Product name required';
          }
          
          const qty = parseFloat(prod.quantity);
          if (isNaN(qty) || qty <= 0) {
            rowErrors.quantity = 'Must be > 0';
          }
          
          const rate = parseFloat(prod.rate);
          if (isNaN(rate) || rate < 0) {
            rowErrors.rate = 'Cannot be negative';
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
    
    const isValid = validateForm();
    if (!isValid) {
      // Find first error and scroll to it
      alert("Please fix the validation errors in the form before saving.");
      return;
    }

    // Filter empty rows
    const cleanedProducts = products
      .filter(p => p.name.trim() && parseFloat(p.quantity) > 0 && parseFloat(p.rate) >= 0)
      .map((p, idx) => ({
        serialNumber: idx + 1,
        name: p.name.trim(),
        quantity: parseFloat(p.quantity),
        unit: p.unit || 'nos',
        rate: parseFloat(p.rate),
        amount: parseFloat(p.amount)
      }));

    const finalChallan = {
      customer: customer.trim(),
      challanNumber: challanNumber.trim(),
      date,
      vehicleNumber: vehicleNumber.trim(),
      remarks: remarks.trim(),
      products: cleanedProducts,
      totalQuantity,
      totalAmount,
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
              {initialData ? `Edit Challan: ${initialData.challanNumber}` : 'New Delivery Challan Details'}
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
              <label htmlFor="customer" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                To (Customer Details) <span className="text-red-500">*</span>
              </label>
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
                    setChallanNumber(e.target.value);
                    if (touched) validateForm(products, customer, e.target.value, date);
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
                      <th className="py-3 px-4 w-[6%] text-center">S.No</th>
                      <th className="py-3 px-4 w-[50%]">Product Name</th>
                      <th className="py-3 px-4 w-[12%] text-right">Quantity</th>
                      <th className="py-3 px-4 w-[14%] text-right">Rate (₹)</th>
                      <th className="py-3 px-4 w-[12%] text-right">Amount (₹)</th>
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
                              {PRODUCT_SUGGESTIONS.map((item, key) => (
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
                                min="1"
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
                          <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700 font-mono">
                            {parseFloat(prod.amount || 0).toFixed(2)}
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
