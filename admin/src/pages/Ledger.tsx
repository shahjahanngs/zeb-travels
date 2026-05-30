// import { useEffect, useState } from "react";
// import { useLocation, useParams } from "react-router";
// import axiosInstance from "../Api/axios";
// import PageMeta from "../components/common/PageMeta";
// import PageBreadCrumb from "../components/common/PageBreadCrumb";

// interface LedgerEntry {
//   voucherId: string;
//   date: string;
//   description: string;
//   debit: number;
//   credit: number;
// }

// const Ledger = () => {
//   const { id } = useParams();
//   const location = useLocation();
//   const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [dateFrom, setDateFrom] = useState(() => {
//     const date = new Date();
//     date.setDate(1); // First day of current month
//     return date.toISOString().split('T')[0];
//   });
//   const [dateTo, setDateTo] = useState(() => {
//     return new Date().toISOString().split('T')[0];
//   });

//   const userName = location.state?.userName || "User";

//   useEffect(() => {
//     if (dateFrom && dateTo) {
//       fetchLedger();
//     }
//   }, []);

//   const fetchLedger = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("admin_token");

//       // This is a placeholder API call - adjust the endpoint as per your backend
//       const response = await axiosInstance.get(`/payment/ledger/${id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         params: {
//           dateFrom,
//           dateTo,
//         },
//       });

//       if (response.data.success) {
//         setLedgerData(response.data.data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching ledger:", error);
//       // Set empty data on error
//       setLedgerData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     fetchLedger();
//   };

//   const calculateTotals = () => {
//     const totalDebit = ledgerData.reduce((sum, entry) => sum + entry.debit, 0);
//     const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.credit, 0);
//     const closingBalance = totalDebit - totalCredit;

//     return { totalDebit, totalCredit, closingBalance };
//   };

//   const { totalDebit, totalCredit, closingBalance } = calculateTotals();

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleExport = async (type: string) => {
//     try {
//       const token = localStorage.getItem("admin_token");

//       if (type === 'copy') {
//         // Copy table data to clipboard
//         const tableData = ledgerData.map(entry => 
//           `${entry.voucherId}\t${new Date(entry.date).toLocaleDateString()}\t${entry.description}\t${entry.debit > 0 ? entry.debit.toFixed(2) : ''}\t${entry.credit > 0 ? entry.credit.toFixed(2) : ''}`
//         ).join('\n');

//         const header = 'Voucher Id\tDate\tDescription\tDebit\tCredit\n';
//         const totals = `\nTotal\t\t\t${totalDebit.toFixed(2)}\t${totalCredit.toFixed(2)}`;
//         const fullText = `Ledger of ${userName.toUpperCase()}\nFrom ${dateFrom} To ${dateTo}\n\n${header}${tableData}${totals}`;

//         await navigator.clipboard.writeText(fullText);
//         alert('Table data copied to clipboard!');
//         return;
//       }

//       // For CSV, Excel, and PDF, download from backend
//       const exportUrl = `/payment/ledger/${id}/export/${type}`;
//       console.log('Exporting from URL:', exportUrl);
//       console.log('With params:', { dateFrom, dateTo, userName });

//       const response = await axiosInstance.get(exportUrl, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         params: {
//           dateFrom,
//           dateTo,
//           userName,
//         },
//         responseType: 'blob',
//       });

//       console.log('Response received:', response.status, response.headers['content-type']);

//       // Check if response is actually an error (JSON) instead of a file
//       if (response.headers['content-type']?.includes('application/json')) {
//         // Response is JSON error, not a file - need to read the blob as text
//         const reader = new FileReader();
//         const errorText = await new Promise<string>((resolve) => {
//           reader.onload = () => resolve(reader.result as string);
//           reader.readAsText(response.data);
//         });
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || 'Export failed');
//       }

//       // Create download link
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;

//       const extension = type === 'csv' ? 'csv' : type === 'excel' ? 'xlsx' : 'pdf';
//       link.setAttribute('download', `ledger-${userName}-${Date.now()}.${extension}`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error: any) {
//       console.error(`Error exporting as ${type}:`, error);
//       console.error('Error response:', error.response);
//       console.error('Error data:', error.response?.data);

//       let errorMessage = `Failed to export as ${type.toUpperCase()}.`;

//       // Handle different error scenarios
//       if (error.response) {
//         // Server responded with an error status
//         if (error.response.data instanceof Blob) {
//           // Error response is a blob (JSON), read it
//           try {
//             const reader = new FileReader();
//             const errorText = await new Promise<string>((resolve) => {
//               reader.onload = () => resolve(reader.result as string);
//               reader.readAsText(error.response.data);
//             });
//             const errorData = JSON.parse(errorText);
//             errorMessage += ` ${errorData.message || errorData.error || ''}`;
//           } catch (e) {
//             console.error('Failed to parse error response:', e);
//             errorMessage += ` Server error (Status: ${error.response.status})`;
//           }
//         } else if (error.response.data?.message) {
//           errorMessage += ` ${error.response.data.message}`;
//         } else {
//           errorMessage += ` Server error (Status: ${error.response.status})`;
//         }
//       } else if (error.request) {
//         // Request was made but no response received
//         errorMessage += ' No response from server. Please check your connection.';
//       } else if (error.message) {
//         // Something else happened
//         errorMessage += ` ${error.message}`;
//       }

//       alert(errorMessage);
//     }
//   };

//   return (
//     <>
//       <PageMeta title={`Ledger - ${userName}`} description="View agent ledger" />
//       <PageBreadCrumb pageTitle="Ledger" />

//       {/* Print Styles */}
//       <style>{`
//         @media print {
//           @page {
//             size: A4;
//             margin: 20mm;
//           }

//           /* Hide non-printable elements */
//           nav, aside, header, footer,
//           .no-print,
//           button:not(.print-keep),
//           [class*="sidebar"],
//           [class*="breadcrumb"] {
//             display: none !important;
//           }

//           /* Reset page styling */
//           body {
//             margin: 0;
//             padding: 0;
//             background: white !important;
//           }

//           /* Container adjustments */
//           .rounded-2xl {
//             border: none !important;
//             box-shadow: none !important;
//             border-radius: 0 !important;
//           }

//           /* Hide date filter form */
//           form {
//             display: none !important;
//           }

//           /* Title styling */
//           h2 {
//             color: #dc2626 !important;
//             font-size: 18pt !important;
//             margin-bottom: 8pt !important;
//           }

//           p {
//             color: #16a34a !important;
//             font-size: 11pt !important;
//             margin-bottom: 16pt !important;
//           }

//           /* Table styling */
//           table {
//             width: 100% !important;
//             border-collapse: collapse !important;
//             page-break-inside: auto !important;
//             font-size: 10pt !important;
//           }

//           thead {
//             display: table-header-group !important;
//             background: #1f2937 !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }

//           thead th {
//             background: #1f2937 !important;
//             color: white !important;
//             padding: 8pt 4pt !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }

//           tbody tr {
//             page-break-inside: avoid !important;
//             page-break-after: auto !important;
//           }

//           tbody td {
//             padding: 6pt 4pt !important;
//             border-bottom: 1px solid #e5e7eb !important;
//             color: #000 !important;
//           }

//           tfoot {
//             display: table-footer-group !important;
//             background: #f3f4f6 !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }

//           tfoot td {
//             background: #f3f4f6 !important;
//             font-weight: bold !important;
//             padding: 8pt 4pt !important;
//             border-top: 2px solid #d1d5db !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }

//           /* Summary box */
//           .bg-gray-50 {
//             background: #f9fafb !important;
//             border: 1px solid #e5e7eb !important;
//             padding: 12pt !important;
//             margin-top: 16pt !important;
//             page-break-inside: avoid !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }

//           /* Color adjustments for print */
//           .text-green-600,
//           .dark\\:text-green-500 {
//             color: #16a34a !important;
//           }

//           .text-red-600,
//           .dark\\:text-red-500 {
//             color: #dc2626 !important;
//           }

//           /* Remove hover effects */
//           tr:hover {
//             background: transparent !important;
//           }
//         }
//       `}</style>

//       <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
//         <div className="px-4 py-6 md:px-6 xl:px-7.5">
//           {/* Header with Date Range Filter */}
//           <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-6 mb-6 no-print">
//             <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
//               <div className="flex-1">
//                 <label className="block mb-2 text-sm font-medium text-white">
//                   Date From
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(e) => setDateFrom(e.target.value)}
//                   className="w-full h-11 rounded-lg border border-blue-400 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
//                   required
//                 />
//               </div>
//               <div className="flex-1">
//                 <label className="block mb-2 text-sm font-medium text-white">
//                   Date To
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(e) => setDateTo(e.target.value)}
//                   className="w-full h-11 rounded-lg border border-blue-400 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
//                   required
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="px-8 py-2.5 h-11 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-colors shadow-md"
//               >
//                 Submit
//               </button>
//             </form>
//           </div>

//           {/* Ledger Title */}
//           <div className="mb-6">
//             <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">
//               Leager of {userName.toUpperCase()}
//             </h2>
//             <p className="text-green-600 dark:text-green-500 font-semibold">
//               From {new Date(dateFrom).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} To {new Date(dateTo).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
//             </p>
//           </div>

//           {/* Export Buttons */}
//           <div className="mb-4 flex flex-wrap gap-2 no-print">
//             <button
//               onClick={() => handleExport('copy')}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
//             >
//               Copy
//             </button>
//             <button
//               onClick={() => handleExport('csv')}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
//             >
//               CSV
//             </button>
//             <button
//               onClick={() => handleExport('excel')}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
//             >
//               Excel
//             </button>
//             <button
//               onClick={() => handleExport('pdf')}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
//             >
//               PDF
//             </button>
//             <button
//               onClick={handlePrint}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
//             >
//               Print
//             </button>
//             <button
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors ml-auto"
//             >
//               Column visibility ▼
//             </button>
//           </div>

//           {/* Print Button - Green */}
//           <div className="mb-6 no-print">
//             <button
//               onClick={handlePrint}
//               className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-md"
//             >
//               Print
//             </button>
//           </div>

//           {/* Table */}
//           {loading ? (
//             <div className="flex justify-center py-10">
//               <div className="text-gray-500 dark:text-gray-400">Loading ledger...</div>
//             </div>
//           ) : (
//             <>
//               <div className="overflow-x-auto">
//                 <table className="w-full table-auto">
//                   <thead className="bg-gray-800 dark:bg-gray-900">
//                     <tr>
//                       <th className="px-4 py-4 text-left text-sm font-medium text-white">Voucher Id</th>
//                       <th className="px-4 py-4 text-left text-sm font-medium text-white">Date</th>
//                       <th className="px-4 py-4 text-left text-sm font-medium text-white">Description</th>
//                       <th className="px-4 py-4 text-right text-sm font-medium text-white">Debit</th>
//                       <th className="px-4 py-4 text-right text-sm font-medium text-white">Credit</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white dark:bg-gray-800/50">
//                     {ledgerData.length === 0 ? (
//                       <tr>
//                         <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
//                           No data available in table
//                         </td>
//                       </tr>
//                     ) : (
//                       ledgerData.map((entry, index) => (
//                         <tr
//                           key={index}
//                           className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/80"
//                         >
//                           <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
//                             {entry.voucherId}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
//                             {new Date(entry.date).toLocaleDateString()}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
//                             {entry.description}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-right text-gray-800 dark:text-white/90">
//                             {entry.debit > 0 ? entry.debit.toFixed(2) : ''}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-right text-gray-800 dark:text-white/90">
//                             {entry.credit > 0 ? entry.credit.toFixed(2) : ''}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                   <tfoot className="bg-gray-100 dark:bg-gray-800 font-semibold">
//                     <tr className="border-t-2 border-gray-300 dark:border-gray-600">
//                       <td colSpan={3} className="px-4 py-3 text-sm text-right text-gray-800 dark:text-white">
//                         Total:
//                       </td>
//                       <td className="px-4 py-3 text-sm text-right text-gray-800 dark:text-white">
//                         {totalDebit.toFixed(2)}
//                       </td>
//                       <td className="px-4 py-3 text-sm text-right text-gray-800 dark:text-white">
//                         {totalCredit.toFixed(2)}
//                       </td>
//                     </tr>
//                   </tfoot>
//                 </table>
//               </div>

//               {/* Summary Box */}
//               <div className="mt-6 max-w-md ml-auto">
//                 <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-700 dark:text-gray-300 font-medium">Debit</span>
//                     <span className="text-gray-900 dark:text-white font-semibold">{totalDebit.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-700 dark:text-gray-300 font-medium">Credit</span>
//                     <span className="text-gray-900 dark:text-white font-semibold">{totalCredit.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-base pt-2 border-t border-gray-300 dark:border-gray-600">
//                     <span className="text-gray-800 dark:text-gray-200 font-bold">Closing Balance</span>
//                     <span className={`font-bold ${closingBalance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
//                       {closingBalance.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default Ledger;


import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import axiosInstance from "../Api/axios";
import PageMeta from "../components/common/PageMeta";
import PageBreadCrumb from "../components/common/PageBreadCrumb";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LedgerEntry {
  voucherId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
}

const Ledger = () => {
  const { id } = useParams();
  const location = useLocation();
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const userName = location.state?.userName || "User";

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchLedger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const response = await axiosInstance.get(`/payment/ledger/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          dateFrom,
          dateTo,
        },
      });

      if (response.data.success) {
        setLedgerData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      // Set empty data on error
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger();
  };

  const calculateTotals = () => {
    const totalDebit = ledgerData.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.credit, 0);
    const closingBalance = totalDebit - totalCredit;

    return { totalDebit, totalCredit, closingBalance };
  };

  const { totalDebit, totalCredit, closingBalance } = calculateTotals();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    const getBase64Image = (url: string): Promise<{ base64: string; width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL("image/png");
          resolve({ base64: dataURL, width: img.width, height: img.height });
        };
        img.onerror = (error) => reject(error);
        img.src = url;
      });
    };

    try {
      const logo = await getBase64Image("/admin-portal/images/logo/logo.png");

      const targetWidth = 25; // Matches your w-22 in HTML
      const aspectRatio = logo.height / logo.width;
      const targetHeight = targetWidth * aspectRatio;

      // --- Header Section ---
      const headerStartX = margin;
      const headerStartY = 10;
      const textStartX = margin + targetWidth + 5; // Space after logo

      // Add Logo
      doc.addImage(logo.base64, "PNG", headerStartX, headerStartY, targetWidth, targetHeight);

      // Add Company Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("AL - MAMOORAH INTERNATIONAL PVT LTD", textStartX, headerStartY + 5);

      // Add Phone & Email
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50); // Slightly grey like text-sm
      doc.text("Phone: 0300-5008889 | Email: meddina786@yahoo.com", textStartX, headerStartY + 11);

      // Add Address
      doc.text("Address: Shop No 03 G-Floor G-13 Services Road G-12 Islamabad", textStartX, headerStartY + 16);

      // Add Horizontal Line
      const lineY = headerStartY + 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, lineY, pageWidth - margin, lineY);

      // --- Blue Account Statement Bar ---
      const barY = lineY + 5;
      doc.setFillColor(99, 186, 248);
      doc.rect(margin, barY, contentWidth, 10, "F");
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, barY, contentWidth, 10, "S");

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Account Statement of ${userName}`, margin + 5, barY + 6.5);

      const dateRange = `From ${new Date(dateFrom).toDateString()} To ${new Date(dateTo).toDateString()}`;
      const dateWidth = doc.getTextWidth(dateRange);
      doc.text(dateRange, pageWidth - margin - dateWidth - 2, barY + 6.5);

      // --- Table Configuration ---
      const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).replace(',', '');
      };

      autoTable(doc, {
        startY: barY + 10,
        margin: { left: margin, right: margin },
        head: [["Date", "V.no", "Details", "Debit", "Credit", "Balance"]],
        body: ledgerWithBalance.map((entry) => [
          formatDate(entry.date),
          entry.voucherId,
          entry.description,
          entry.debit > 0 ? Math.round(entry.debit).toLocaleString() : "0",
          entry.credit > 0 ? Math.round(entry.credit).toLocaleString() : "0",
          formatBalance(entry.balance || 0),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 15 },
          3: { halign: "right", cellWidth: 20 },
          4: { halign: "right", cellWidth: 20 },
          5: { halign: "right", cellWidth: 28 },
        },
        foot: [
          [
            {
              content: `Closing Balance as on ${new Date(dateTo).toDateString()}`,
              colSpan: 5,
              styles: { halign: "left", fontStyle: "bold" },
            },
            { content: formatBalance(closingBalance), styles: { halign: "right", fontStyle: "bold" } },
          ],
          [
            { content: "Total", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } },
            { content: Math.round(totalDebit).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
            { content: Math.round(totalCredit).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
            { content: formatBalance(closingBalance), styles: { halign: "right", fontStyle: "bold" } },
          ],
        ],
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
        },
      });

      doc.save(`ledger-${userName}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Could not load the logo or generate PDF.");
    }
  };

  type LedgerEntryWithBalance = typeof ledgerData extends Array<infer T>
    ? T & { balance: number }
    : never;

  const ledgerWithBalance = ledgerData.reduce((acc: LedgerEntryWithBalance[], entry) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    const balance = prevBalance + entry.debit - entry.credit;

    acc.push({ ...entry, balance });
    return acc;
  }, [] as LedgerEntryWithBalance[]);

  const formatBalance = (balance: number) => {
    const type = balance >= 0 ? "DR" : "CR";
    return `${Math.abs(Math.round(balance)).toLocaleString()} ${type}`;
  };

  return (
    <>
      <PageMeta title={`Ledger - ${userName}`} description="View agent ledger" />
      <PageBreadCrumb pageTitle="Ledger" />

      {/* Print Styles */}
      <style>{`
.print-layout-active {
  background: white !important;
  color: black !important;
  width: 210mm; /* Fixed A4 width for consistent scaling */
  padding: 10mm;
  font-family: sans-serif;
}

.print-layout-active table {
  border-collapse: collapse !important;
  width: 100% !important;
  border: 1px solid #000 !important;
}

.print-layout-active th, 
.print-layout-active td {
  border: 1px solid #000 !important;
  color: black !important;
  padding: 6px !important;
}

.print-layout-active .print-header {
  background-color: #63BAF8 !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color: black !important;
  border: 1px solid #000 !important;
}

/* Hide everything else when the PDF generator is running */
.generating-pdf #ledger-print-area {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
}

        @media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    margin: 0;
    padding: 0;
    background: white !important;
  }

  /* Hide everything except print area */
  body * {
    visibility: hidden;
  }

  #ledger-print-area,
  #ledger-print-area * {
    visibility: visible;
  }

  #ledger-print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  /* Remove UI styling */
  .no-print {
    display: none !important;
  }

    .print-mode body * {
  visibility: hidden;
}

.print-mode #ledger-print-area,
.print-mode #ledger-print-area * {
  visibility: visible;
}

.print-mode #ledger-print-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: white;
}

  /* Clean table */
  table {
    border-collapse: collapse !important;
    width: 100%;
    font-size: 11px;
  }

  th, td {
    border: 1px solid #000 !important;
    padding: 6px !important;
  }

  thead {
    background: #e5e7eb !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Blue header fix */
  .print-header {
    background: #63BAF8 !important;
    color: black !important;
    font-size: 14px !important;
    border: 1px solid #333 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Remove shadows, rounded corners */
  .rounded-2xl,
  .shadow-sm {
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
      `}</style>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/3">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          {/* Header with Date Range Filter */}
          <div className="rounded-lg mb-6 no-print">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-white">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-11 rounded-lg border border-blue-400 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-white">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-11 rounded-lg border border-blue-400 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-8 py-2.5 h-11 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-colors shadow-md"
              >
                Submit
              </button>
            </form>
          </div>

          {/* Export Buttons */}
          <div className="mb-4 flex flex-wrap gap-2 no-print">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Print
            </button>
          </div>

          <div id="ledger-print-area">
            {/* Ledger Header */}
            <div className="mb-4 border-b border-gray-400 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src="/admin-portal/images/logo/logo.png"
                  alt="Logo"
                  className="w-30 h-30 object-contain"
                />

                <div>
                  <h2 className="text-lg font-semibold">AL - MAMOORAH INTERNATIONAL PVT LTD</h2>
                  <p className="text-sm"><span>Phone: 0300-5008889</span> | <span>Email:meddina786@yahoo.com</span></p>
                  <p className="text-sm">Office # 15-16, Ground Floor, Poonch House,
                    Adamjee Road, Saddar, Rawalpindi, Pakistan</p>
                </div>
              </div>
            </div>

            {/* Ledger Title */}
            <div className="mb-4">
              <div className="print-header bg-[#63BAF8] text-black px-4 py-2 flex justify-between text-base font-semibold">
                <span>Account Statement of {userName}</span>
                <span>
                  From {new Date(dateFrom).toDateString()} To {new Date(dateTo).toDateString()}
                </span>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="text-gray-500 dark:text-gray-400">Loading ledger...</div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-400 border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-2 py-2 text-left">Date</th>
                        <th className="border px-2 py-2 text-left">V.no</th>
                        <th className="border px-2 py-2 text-left">Details</th>
                        <th className="border px-2 py-2 text-right">Debit</th>
                        <th className="border px-2 py-2 text-right">Credit</th>
                        <th className="border px-2 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/50">
                      {ledgerData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        ledgerWithBalance.map((entry, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                          >
                            <td className="border px-2 py-2">
                              {new Date(entry.date).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="border px-2 py-2">
                              {entry.voucherId}
                            </td>
                            <td className="border px-2 py-2">
                              {entry.description}
                            </td>
                            <td className="border px-2 py-2 text-right">
                              {entry.debit > 0 ? Math.round(entry.debit).toLocaleString() : '0'}
                            </td>
                            <td className="border px-2 py-2 text-right">
                              {entry.credit > 0 ? Math.round(entry.credit).toLocaleString() : '0'}
                            </td>
                            <td className="border px-2 py-2 text-right">
                              {formatBalance(entry.balance || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} className="border px-2 py-2 font-semibold">
                          Closing Balance as on {new Date(dateTo).toDateString()}
                        </td>
                        <td className="border px-2 py-2 text-right font-bold">
                          {formatBalance(closingBalance)}
                        </td>
                      </tr>

                      <tr className="font-bold">
                        <td colSpan={3} className="border px-2 py-2 text-center">Total</td>
                        <td className="border px-2 py-2 text-right">
                          {totalDebit.toLocaleString()}
                        </td>
                        <td className="border px-2 py-2 text-right">
                          {totalCredit.toLocaleString()}
                        </td>
                        <td className="border px-2 py-2 text-right">
                          {formatBalance(closingBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Summary Box */}
          <div className="mt-6 max-w-md ml-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Debit</span>
                <span className="text-gray-900 dark:text-white font-semibold">{Math.round(totalDebit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Credit</span>
                <span className="text-gray-900 dark:text-white font-semibold">{Math.round(totalCredit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="text-gray-800 dark:text-gray-200 font-bold">Closing Balance</span>
                <span className={`font-bold ${closingBalance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {Math.round(closingBalance).toLocaleString()} {closingBalance >= 0 ? 'DR' : 'CR'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Ledger;