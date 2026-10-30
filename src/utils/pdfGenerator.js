import { jsPDF } from 'jspdf';

/**
 * Helper to convert local image URL to base64 data URL
 */
const getBase64ImageFromUrl = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load logo image as base64:", error);
    return null;
  }
};

/**
 * Format Date from YYYY-MM-DD to DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

/**
 * Helper to replace Rupee symbol with "Rs." to avoid font encoding issues in standard Helvetica
 */
const formatPdfCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0.00';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return formatted.replace('₹', 'Rs. ');
};

/**
 * Generates and downloads a vector-drawn A4 PDF using jsPDF APIs.
 * @param {Object} challan - Challan details object
 * @param {Object} companyDetails - Company letterhead profile
 */
export const downloadChallanPDF = async (challan, companyDetails, options = {}) => {
  if (!challan) return Promise.reject(new Error("Challan data missing"));

  // Check if seal should be included
  const includeSeal = options?.includeSeal !== undefined 
    ? options.includeSeal 
    : (challan.includeSeal !== false);

  const details = companyDetails || {
    companyName: "TEKPOWER ENERGY SOLUTIONS",
    address: "No.78, Sidco Industrial Estate,\nPhase - II, Thirumudivakkam,\nChennai - 600044",
    gstNumber: "33EGXPD3539N1ZR",
    mobileNumber: "7358818249 / 9940523444",
    phoneNumber: "044 - 24780224",
    footerTagline: "Power Quality Solution Provider & Panel Builders"
  };

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Load logo and seal images
  const logoBase64 = await getBase64ImageFromUrl('/logo.png');
  const sealBase64 = await getBase64ImageFromUrl('/seal.png');

  // --- Page Setup ---
  // A4 size: 210mm x 297mm. Margin: 10mm. Printable Width: 190mm
  pdf.setLineWidth(0.2);
  pdf.setDrawColor(30, 41, 59); // Slate-800

  // 1. Header Logo & Details
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', 10, 11, 46, 21);
  } else {
    // Fallback vector block logo
    pdf.setFillColor(15, 23, 42); // Slate-900
    pdf.rect(10, 11, 46, 17, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("TEK", 13, 17);
    pdf.setFontSize(9);
    pdf.setTextColor(245, 158, 11); // Amber
    pdf.text("POWER", 13, 23);
  }

  // Right Side Company Profile details
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13.5);
  pdf.setTextColor(211, 47, 47); // Red #d32f2f
  pdf.text(details.companyName, 200, 14.5, { align: 'right' });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  
  const addrLines = details.address.split('\n');
  let addrY = 19;
  addrLines.forEach(line => {
    pdf.text(line.trim(), 200, addrY, { align: 'right' });
    addrY += 3.2;
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(`GSTN No: ${details.gstNumber}`, 200, addrY + 1.2, { align: 'right' });
  pdf.text(`Mobile No: ${details.mobileNumber}`, 200, addrY + 4.4, { align: 'right' });
  pdf.text(`Phone: ${details.phoneNumber}`, 200, addrY + 7.6, { align: 'right' });

  // 2. Title Capsule
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(77, 44, 56, 5, 2.5, 2.5, 'S'); // Title capsule outline
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text("DELIVERY CHALLAN", 105, 47.7, { align: 'center' });

  // 3. Customer and DC Metadata Boxes
  pdf.setLineWidth(0.25);
  
  // Left Customer Box
  pdf.roundedRect(10, 52, 92, 32, 2, 2, 'S');
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("To :", 13, 56.5);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  const custLines = pdf.splitTextToSize(challan.customer, 85);
  pdf.text(custLines, 13, 61.5);

  // Right Metadata Box
  pdf.roundedRect(108, 52, 92, 32, 2, 2, 'S');
  pdf.setFont("helvetica", "bold");
  pdf.text("DC No.:", 112, 60);
  pdf.setFont("helvetica", "normal");
  pdf.text(challan.challanNumber, 127, 60);
  
  pdf.setFont("helvetica", "bold");
  pdf.text("Date :", 112, 68);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatDate(challan.date), 125, 68);

  if (challan.vehicleNumber) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Vehicle No:", 112, 76);
    pdf.setFont("helvetica", "normal");
    pdf.text(challan.vehicleNumber, 131, 76);
  }

  // 4. Product Entry Table & Pagination Logic
  const tableX = 10;
  const tableY = 90; // Fixed start Y for every page to keep format identical
  const tableW = 190;
  const colX = { sno: 21, products: 121, qty: 143, rate: 168 };
  
  // Reduce row height to fit exactly 20 rows + footer on an A4 page
  const rowH = 7.0; 
  const ROWS_PER_PAGE = 20;
  
  const allProducts = [...(challan.products || [])];
  
  // Pad with empty rows to multiples of 20
  while (allProducts.length < ROWS_PER_PAGE || allProducts.length % ROWS_PER_PAGE !== 0) {
    allProducts.push({ name: '', quantity: '', rate: '', amount: '' });
  }

  const totalPages = Math.ceil(allProducts.length / ROWS_PER_PAGE);
  let currentProdIdx = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (pageNum > 1) {
      pdf.addPage();
      
      // Redraw Header & Metadata for identical format on next page
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', 10, 11, 46, 21);
      } else {
        pdf.setFillColor(15, 23, 42);
        pdf.rect(10, 11, 46, 17, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("TEK", 13, 17);
        pdf.setFontSize(9);
        pdf.setTextColor(245, 158, 11);
        pdf.text("POWER", 13, 23);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13.5);
      pdf.setTextColor(211, 47, 47);
      pdf.text(details.companyName, 200, 14.5, { align: 'right' });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.8);
      pdf.setTextColor(30, 41, 59);
      let addrY2 = 19;
      details.address.split('\n').forEach(line => {
        pdf.text(line.trim(), 200, addrY2, { align: 'right' });
        addrY2 += 3.2;
      });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(`GSTN No: ${details.gstNumber}`, 200, addrY2 + 1.2, { align: 'right' });
      pdf.text(`Mobile No: ${details.mobileNumber}`, 200, addrY2 + 4.4, { align: 'right' });
      pdf.text(`Phone: ${details.phoneNumber}`, 200, addrY2 + 7.6, { align: 'right' });

      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(77, 44, 56, 5, 2.5, 2.5, 'S');
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text("DELIVERY CHALLAN", 105, 47.7, { align: 'center' });
      
      pdf.setLineWidth(0.25);
      pdf.roundedRect(10, 52, 92, 32, 2, 2, 'S');
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.text("To :", 13, 56.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(pdf.splitTextToSize(challan.customer, 85), 13, 61.5);

      pdf.roundedRect(108, 52, 92, 32, 2, 2, 'S');
      pdf.setFont("helvetica", "bold");
      pdf.text("DC No.:", 112, 60);
      pdf.setFont("helvetica", "normal");
      pdf.text(challan.challanNumber, 127, 60);
      pdf.setFont("helvetica", "bold");
      pdf.text("Date :", 112, 68);
      pdf.setFont("helvetica", "normal");
      pdf.text(formatDate(challan.date), 125, 68);
      
      if (challan.vehicleNumber) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Vehicle No:", 112, 76);
        pdf.setFont("helvetica", "normal");
        pdf.text(challan.vehicleNumber, 131, 76);
      }
    }

    const isLastPage = (pageNum === totalPages);
    const rowsThisPage = ROWS_PER_PAGE; // Always 20
    const currentTableH = 7 + (rowsThisPage * rowH) + (isLastPage ? 8 : 0);

    // Outer border
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(30, 41, 59);
    pdf.rect(tableX, tableY, tableW, currentTableH, 'S');

    // Vertical lines
    pdf.line(colX.sno, tableY, colX.sno, tableY + currentTableH);
    pdf.line(colX.products, tableY, colX.products, tableY + currentTableH);
    pdf.line(colX.qty, tableY, colX.qty, tableY + currentTableH);
    pdf.line(colX.rate, tableY, colX.rate, tableY + currentTableH);

    // Headers
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("S.No", (tableX + colX.sno) / 2, tableY + 4.8, { align: 'center' });
    pdf.text("PRODUCTS", colX.sno + 3, tableY + 4.8);
    pdf.text("QUANTITY", (colX.products + colX.qty) / 2, tableY + 4.8, { align: 'center' });
    pdf.text("RATE", (colX.qty + colX.rate) / 2, tableY + 4.8, { align: 'center' });
    pdf.text("AMOUNT", (colX.rate + 200) / 2, tableY + 4.8, { align: 'center' });
    pdf.line(tableX, tableY + 7, tableX + tableW, tableY + 7);

    // Rows
    const startRowY = tableY + 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);

    for (let i = 0; i < rowsThisPage; i++) {
      const prod = allProducts[currentProdIdx];
      const currentY = startRowY + i * rowH;
      const textY = currentY + 4.8; // perfectly centered in a 7.0mm row

      if (prod.name !== undefined && prod.name !== '') {
         pdf.text(String(currentProdIdx + 1), (tableX + colX.sno) / 2, textY, { align: 'center' });
         
         // Dynamically wrap product name to show all words
         pdf.setFontSize(8.5);
         let nameLines = pdf.splitTextToSize(prod.name, 96);
         if (nameLines.length === 1) {
           pdf.text(nameLines[0], colX.sno + 3, textY);
         } else if (nameLines.length === 2) {
           pdf.setFontSize(7.5);
           nameLines = pdf.splitTextToSize(prod.name, 96);
           if (nameLines.length === 1) {
             pdf.text(nameLines[0], colX.sno + 3, textY);
           } else {
             pdf.text(nameLines[0], colX.sno + 3, currentY + 3.1);
             pdf.text(nameLines[1], colX.sno + 3, currentY + 5.9);
           }
         } else {
           pdf.setFontSize(6.8);
           nameLines = pdf.splitTextToSize(prod.name, 96);
           const startY = currentY + 2.5;
           const lineGap = 2.2;
           nameLines.slice(0, 3).forEach((line, lineIdx) => {
             pdf.text(line, colX.sno + 3, startY + (lineIdx * lineGap));
           });
         }
         pdf.setFontSize(8.5);

         if(prod.quantity && parseFloat(prod.quantity) > 0) {
           const qtyText = prod.unit ? `${prod.quantity} ${prod.unit}` : String(prod.quantity);
           pdf.text(qtyText, (colX.products + colX.qty) / 2, textY, { align: 'center' });
         }
         if(prod.rate !== undefined && prod.rate !== '' && parseFloat(prod.rate) > 0) {
           pdf.text(parseFloat(prod.rate).toFixed(2), colX.rate - 2, textY, { align: 'right' });
         } else if (parseFloat(prod.quantity) > 0 && prod.rate !== undefined && prod.rate !== '') {
           pdf.text("0.00", colX.rate - 2, textY, { align: 'right' });
         }
         if(prod.amount !== undefined && prod.amount !== '') pdf.text(parseFloat(prod.amount).toFixed(2), 198, textY, { align: 'right' });
      }

      if (i < rowsThisPage - 1 || isLastPage) {
         pdf.line(tableX, currentY + rowH, tableX + tableW, currentY + rowH);
      }
      currentProdIdx++;
    }

    if (isLastPage) {
      // Draw Total Row
      const totalRowY = tableY + currentTableH - 8;
      pdf.setFillColor(245, 247, 250);
      pdf.rect(tableX + 0.1, totalRowY + 0.1, tableW - 0.2, 7.8, 'F');
      pdf.line(tableX, totalRowY, tableX + tableW, totalRowY);
      
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text("TOTAL", colX.sno + 3, totalRowY + 5.2);
      
      const realProducts = challan.products || [];
      const totalQty = realProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
      pdf.text(String(totalQty), (colX.products + colX.qty) / 2, totalRowY + 5.2, { align: 'center' });
      
      const totalAmount = realProducts.reduce((sum, p) => {
        if (p.amount !== undefined && p.amount !== '' && !isNaN(parseFloat(p.amount))) {
          return sum + parseFloat(p.amount);
        }
        return sum + ((parseFloat(p.quantity) || 0) * (parseFloat(p.rate) || 0));
      }, 0);
      pdf.text(formatPdfCurrency(totalAmount), 198, totalRowY + 5.2, { align: 'right' });

      // 5. Remarks / Description Box (Rendered only on last page)
      const remarksY = 247; 
      const remarksH = 13; // Reduced from 15 to give the 'For' text more clearance
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(10, remarksY, 190, remarksH, 1.5, 1.5, 'FD');
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("REMARKS / DESCRIPTION:", 13, remarksY + 4);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      const remarksLines = pdf.splitTextToSize(challan.remarks || '', 184);
      pdf.text(remarksLines, 13, remarksY + 8);

      // 6. Footer Signature Blocks (Rendered only on last page)
      const footerY = 265; 
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Received By :", 10, footerY);
      
      pdf.setLineWidth(0.2);
      pdf.setDrawColor(148, 163, 184);
      pdf.line(10, footerY + 16, 65, footerY + 16);
      
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text("(Name & Signature)", 10, footerY + 20.5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("For", 200, footerY - 1, { align: 'right' });
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(211, 47, 47);
      pdf.text(details.companyName, 200, footerY + 3.2, { align: 'right' });
      
      // Company Seal Stamp (bottom of TEKPOWER, left of Authorised Signatory, without touching words)
      if (includeSeal && sealBase64) {
        pdf.addImage(sealBase64, 'PNG', 150, footerY + 4.8, 20, 20);
      }
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Authorised Signatory", 200, footerY + 20, { align: 'right' });
    }

    // 7. Bottom Banner Slogan (Rendered on every page)
    const bannerY = 288;
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(10, bannerY, 190, 7, 1.5, 1.5, 'F');
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.2);
    pdf.setTextColor(255, 255, 255);
    pdf.text(details.footerTagline.toUpperCase(), 105, bannerY + 4.8, { align: 'center' });

    // 8. Cancelled Watermark Stamp (drawn on every page if status is Cancelled)
    if (challan.status === 'Cancelled') {
      pdf.saveState();
      pdf.setDrawColor(239, 68, 68);
      pdf.setTextColor(239, 68, 68);
      
      // Draw double border stamp box
      pdf.setLineWidth(2.5);
      pdf.rotate(-15, 105, 148.5);
      pdf.roundedRect(65, 137, 80, 22, 3, 3, 'S');
      pdf.setLineWidth(0.8);
      pdf.roundedRect(66.5, 138.5, 77, 19, 2, 2, 'S');
      
      // Draw text
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(30);
      pdf.text("CANCELLED", 105, 151, { align: 'center' });
      pdf.restoreState();
    }
  }

  // Save the PDF file
  pdf.save(`Delivery-Challan-${challan.challanNumber}.pdf`);
  return Promise.resolve();
};
