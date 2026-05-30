import { useEffect, useState } from "react";
import axiosInstance from "../Api/axios";
import PageMeta from "../components/common/PageMeta";
import PageBreadCrumb from "../components/common/PageBreadCrumb";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Bank {
  _id: string;
  bankName: string;
  accountTitle: string;
  accountNo: string;
  ibn?: string;
  logo?: string;
  status: string;
}

interface BankLedgerEntry {
  voucherId: string;
  date: string;
  agentName: string;
  description: string;
  bankDebit: number;
  adminCredit: number;
  balance: number;
}

const BankLedger = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  console.log(selectedBankAccount)
  const [ledgerData, setLedgerData] = useState<BankLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setBanksLoading(true);
      const token = sessionStorage.getItem("admin_token");
      const response = await axiosInstance.get("/bank", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const activeBanks = response.data.data.filter(
          (b: Bank) => b.status === "Active"
        );
        setBanks(activeBanks);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    } finally {
      setBanksLoading(false);
    }
  };

  const fetchLedger = async (bankId: string) => {
    if (!bankId) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem("admin_token");
      const response = await axiosInstance.get(
        `/payment/bank-ledger/${bankId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { dateFrom, dateTo },
        }
      );
      if (response.data.success) {
        setLedgerData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching bank ledger:", error);
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    const bank = banks.find((b) => b._id === bankId);
    setSelectedBankName(bank ? bank.bankName : "");
    setSelectedBankAccount(bank ? `${bank.accountTitle} (${bank.accountNo})` : "");
    setLedgerData([]);
    if (bankId) {
      fetchLedger(bankId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBank) fetchLedger(selectedBank);
  };

  const totalBankDebit = ledgerData.reduce((s, e) => s + e.bankDebit, 0);
  const totalAdminCredit = ledgerData.reduce((s, e) => s + e.adminCredit, 0);
  const closingBalance = ledgerData[ledgerData.length - 1]?.balance ?? 0;

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

      const targetWidth = 25;
      const aspectRatio = logo.height / logo.width;
      const targetHeight = targetWidth * aspectRatio;

      // Header Section
      const headerStartX = margin;
      const headerStartY = 10;
      const textStartX = margin + targetWidth + 5;

      // Add Logo
      doc.addImage(logo.base64, "PNG", headerStartX, headerStartY, targetWidth, targetHeight);

      // Add Company Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("AL - MAMOORAH INTERNATIONAL PVT LTD", textStartX, headerStartY + 5);

      // Add Phone & Email
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("Phone: 0300-5008889 | Email: meddina786@yahoo.com", textStartX, headerStartY + 11);

      // Add Address
      doc.text("Address: Shop No 03 G-Floor G-13 Services Road G-12 Islamabad", textStartX, headerStartY + 16);

      // Add Horizontal Line
      const lineY = headerStartY + 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, lineY, pageWidth - margin, lineY);

      // Blue Account Statement Bar
      const barY = lineY + 5;
      doc.setFillColor(99, 186, 248);
      doc.rect(margin, barY, contentWidth, 10, "F");
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, barY, contentWidth, 10, "S");

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Bank Ledger Statement - ${selectedBankName}`, margin + 5, barY + 6.5);

      const dateRange = `From ${new Date(dateFrom).toDateString()} To ${new Date(dateTo).toDateString()}`;
      const dateWidth = doc.getTextWidth(dateRange);
      doc.text(dateRange, pageWidth - margin - dateWidth - 2, barY + 6.5);

      // Table Configuration
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
        head: [["Date", "Voucher ID", "Agent", "Description", "Debit", "Credit", "Balance"]],
        body: ledgerData.map((entry) => [
          formatDate(entry.date),
          entry.voucherId,
          entry.agentName,
          entry.description,
          entry.bankDebit > 0 ? Math.round(entry.bankDebit).toLocaleString() : "0",
          entry.adminCredit > 0 ? Math.round(entry.adminCredit).toLocaleString() : "0",
          Math.round(entry.balance).toLocaleString(),
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
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          4: { halign: "right", cellWidth: 20 },
          5: { halign: "right", cellWidth: 20 },
          6: { halign: "right", cellWidth: 28 },
        },
        foot: [
          [
            {
              content: `Closing Balance as on ${new Date(dateTo).toDateString()}`,
              colSpan: 6,
              styles: { halign: "left", fontStyle: "bold" },
            },
            { content: Math.round(closingBalance).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
          ],
          [
            { content: "Total", colSpan: 4, styles: { halign: "center", fontStyle: "bold" } },
            { content: Math.round(totalBankDebit).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
            { content: Math.round(totalAdminCredit).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
            { content: Math.round(closingBalance).toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
          ],
        ],
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
        },
      });

      doc.save(`bank-ledger-${selectedBankName}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Could not load the logo or generate PDF.");
    }
  };

  return (
    <>
      <PageMeta title="Bank Ledger" description="Bank-wise payment ledger" />
      <PageBreadCrumb pageTitle="Bank Ledger" />

      {/* Print Styles - Same as Ledger Component */}
      <style>{`
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

          #bank-ledger-print-area,
          #bank-ledger-print-area * {
            visibility: visible;
          }

          #bank-ledger-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          /* Remove UI styling */
          .no-print {
            display: none !important;
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

          {/* Header with Bank Selector and Date Range Filter */}
          <div className="rounded-lg mb-6 no-print">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Bank Selector */}
              <div>
                <label className="block mb-2 text-sm font-medium text-white dark:text-gray-200">
                  Select Bank
                </label>
                {banksLoading ? (
                  <p className="text-gray-500 text-sm">Loading banks...</p>
                ) : (
                  <select
                    value={selectedBank}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full h-11 rounded-lg border border-blue-400 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    <option value="">-- Select a Bank --</option>
                    {banks.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.bankName} — {bank.accountTitle} ({bank.accountNo})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date Range Fields */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium text-white dark:text-gray-200">
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
                  <label className="block mb-2 text-sm font-medium text-white dark:text-gray-200">
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
                  disabled={!selectedBank}
                  className="px-8 py-2.5 h-11 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-gray-900 font-semibold rounded-lg transition-colors shadow-md"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>

          {/* Export Buttons */}
          {selectedBank && ledgerData.length > 0 && (
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
          )}

          {/* Print Area */}
          <div id="bank-ledger-print-area">
            {/* Bank Ledger Header - Same as Ledger Component */}
            <div className="mb-4 border-b border-gray-400 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src="/admin-portal/images/logo/logo.png"
                  alt="Logo"
                  className="w-30 h-30 object-contain"
                />
                <div>
                  <h2 className="text-lg font-semibold">AL - MAMOORAH INTERNATIONAL PVT LTD</h2>
                  <p className="text-sm">
                    <span>Phone: 0300-5008889</span> | <span>Email: meddina786@yahoo.com</span>
                  </p>
                  <p className="text-sm">
                    Office # 15-16, Ground Floor, Poonch House, Adamjee Road, Saddar, Rawalpindi, Pakistan
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Title - Blue Header Bar */}
            {selectedBankName && (
              <div className="mb-4">
                <div className="print-header bg-[#63BAF8] text-black px-4 py-2 flex justify-between text-base font-semibold">
                  <span>Bank Ledger Statement - {selectedBankName}</span>
                  <span>
                    From {new Date(dateFrom).toDateString()} To {new Date(dateTo).toDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-10">
                <div className="text-gray-500 dark:text-gray-400">Loading bank ledger...</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && selectedBank && ledgerData.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No approved payments found for this bank in the selected date range.
              </div>
            )}

            {/* No Bank Selected */}
            {!selectedBank && !banksLoading && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Please select a bank to view its ledger.
              </div>
            )}

            {/* Table */}
            {!loading && ledgerData.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-400 border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-2 py-2 text-left">Date</th>
                        <th className="border px-2 py-2 text-left">Voucher ID</th>
                        <th className="border px-2 py-2 text-left">Agent</th>
                        <th className="border px-2 py-2 text-left">Description</th>
                        <th className="border px-2 py-2 text-right">Debit</th>
                        <th className="border px-2 py-2 text-right">Credit</th>
                        <th className="border px-2 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/50">
                      {ledgerData.map((entry, index) => (
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
                          <td className="border px-2 py-2 font-mono text-xs">
                            {entry.voucherId}
                          </td>
                          <td className="border px-2 py-2">
                            {entry.agentName}
                          </td>
                          <td className="border px-2 py-2">
                            {entry.description}
                          </td>
                          <td className="border px-2 py-2 text-right text-red-600">
                            {entry.bankDebit > 0 ? Math.round(entry.bankDebit).toLocaleString() : '0'}
                          </td>
                          <td className="border px-2 py-2 text-right">
                            {entry.adminCredit > 0 ? Math.round(entry.adminCredit).toLocaleString() : '0'}
                          </td>
                          <td className="border px-2 py-2 text-right font-semibold">
                            {Math.round(entry.balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="border px-2 py-2 font-semibold">
                          Closing Balance as on {new Date(dateTo).toDateString()}
                        </td>
                        <td className="border px-2 py-2 text-right font-bold">
                          {Math.round(closingBalance).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={4} className="border px-2 py-2 text-center">Total</td>
                        <td className="border px-2 py-2 text-right">
                          {Math.round(totalBankDebit).toLocaleString()}
                        </td>
                        <td className="border px-2 py-2 text-right">
                          {Math.round(totalAdminCredit).toLocaleString()}
                        </td>
                        <td className="border px-2 py-2 text-right">
                          {Math.round(closingBalance).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Summary Box - Same as Ledger Component */}
          {!loading && ledgerData.length > 0 && (
            <div className="mt-6 max-w-md ml-auto">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Total Bank Debit</span>
                  <span className="text-red-600 dark:text-red-500 font-semibold">
                    {Math.round(totalBankDebit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Total Admin Credit</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {Math.round(totalAdminCredit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-gray-800 dark:text-gray-200 font-bold">Closing Balance</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {Math.round(closingBalance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BankLedger;