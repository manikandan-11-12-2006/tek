import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallanById } from '../utils/storage';
import ChallanForm from '../components/ChallanForm';

export default function NewChallan({ onSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const data = getChallanById(id);
      if (data) {
        setChallan(data);
      } else {
        alert("Challan not found!");
        navigate('/');
      }
      setLoading(false);
    } else {
      setChallan(null);
    }
  }, [id, navigate]);

  const handleSave = (formData, printAfterSave) => {
    onSave(formData, id, printAfterSave);
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/view/${id}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="text-slate-500 font-medium">Loading challan details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form title details */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          {id ? 'Edit Delivery Challan' : 'Create Delivery Challan'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {id 
            ? 'Modify the details below to update this delivery challan.' 
            : 'Fill in client info and items. The DC number is automatically calculated based on the highest index in database.'}
        </p>
      </div>

      <ChallanForm 
        initialData={challan} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
