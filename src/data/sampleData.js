export const sampleChallans = [
  {
    id: "tek-0001-id",
    challanNumber: "TEK-0001",
    date: "2026-08-20",
    customer: "ABC Engineering Pvt Ltd\nPlot No. 12, Industrial Area, Sector 5\nChennai - 600032",
    products: [
      {
        serialNumber: 1,
        name: "APFC Panel 150 KVAR",
        quantity: 1,
        rate: 45000,
        amount: 45000
      },
      {
        serialNumber: 2,
        name: "Capacitor Bank 25 KVAR",
        quantity: 2,
        rate: 12500,
        amount: 25000
      },
      {
        serialNumber: 3,
        name: "Control Panel Accessories (L&T Components)",
        quantity: 1,
        rate: 25000,
        amount: 25000
      }
    ],
    totalQuantity: 4,
    totalAmount: 95000,
    createdAt: "2026-08-20T10:30:00.000Z",
    updatedAt: "2026-08-20T10:30:00.000Z"
  },
  {
    id: "tek-0002-id",
    challanNumber: "TEK-0002",
    date: "2026-08-22",
    customer: "Vertex Power Systems\nNo. 45, First Main Road, Ambattur Industrial Estate\nChennai - 600058",
    products: [
      {
        serialNumber: 1,
        name: "MCC Panel (Motor Control Centre)",
        quantity: 1,
        rate: 85000,
        amount: 85000
      },
      {
        serialNumber: 2,
        name: "Electrical Components & Spare Parts Kit",
        quantity: 5,
        rate: 4200,
        amount: 21000
      }
    ],
    totalQuantity: 6,
    totalAmount: 106000,
    createdAt: "2026-08-22T14:15:00.000Z",
    updatedAt: "2026-08-22T14:15:00.000Z"
  },
  {
    id: "tek-0003-id",
    challanNumber: "TEK-0003",
    date: "2026-08-24",
    customer: "Sri Balaji Industries\nSurvey No. 120, Thirumudivakkam High Road\nChennai - 600044",
    products: [
      {
        serialNumber: 1,
        name: "Automatic Main Failure (AMF) Panel",
        quantity: 1,
        rate: 65000,
        amount: 65000
      },
      {
        serialNumber: 2,
        name: "100A Changeover Switch Panel",
        quantity: 2,
        rate: 15000,
        amount: 30000
      },
      {
        serialNumber: 3,
        name: "Digital Energy Meters (Multi-function)",
        quantity: 4,
        rate: 3500,
        amount: 14000
      }
    ],
    totalQuantity: 7,
    totalAmount: 109000,
    createdAt: "2026-08-24T09:00:00.000Z",
    updatedAt: "2026-08-24T09:00:00.000Z"
  }
];

export const defaultCompanyDetails = {
  companyName: "TEKPOWER ENERGY SOLUTIONS",
  address: "No.78, Sidco Industrial Estate,\nPhase - II, Thirumudivakkam,\nChennai - 600044",
  gstNumber: "33EGXPD3539N1ZR",
  mobileNumber: "7358818249 / 9940523444",
  phoneNumber: "044 - 24780224",
  footerTagline: "Power Quality Solution Provider & Panel Builders"
};
