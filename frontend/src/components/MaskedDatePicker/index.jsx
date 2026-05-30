// MaskedDatePicker.jsx
import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function MaskedDatePicker({
  value,
  onChange,
  size = "normal",
  maxDate = null,
  minDate = null,
  placeholderText = "DD/MM/YYYY",
}) {
  const [selectedDate, setSelectedDate] = useState(
    value instanceof Date ? value : value ? new Date(value) : null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [showYearInput, setShowYearInput] = useState(false);
  const [yearValue, setYearValue] = useState("");
  const inputRef = useRef(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onChange(date);
    setIsOpen(false);
  };

  const sizeClasses = {
    small: "w-full px-2 py-1 text-xs",
    normal: "w-full px-3 py-2 text-sm",
    large: "w-full px-4 py-3 text-base",
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const CustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();

    useEffect(() => {
      if (showYearInput && inputRef.current) {
        inputRef.current.focus();
      }
    }, [showYearInput]);

    const handleYearKeyDown = (e) => {
      if (e.key === "Enter") {
        let newYear = parseInt(yearValue);
        if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
          changeYear(newYear);
        }
        setShowYearInput(false);
        setYearValue("");
      } else if (e.key === "Escape") {
        setShowYearInput(false);
        setYearValue("");
      }
    };

    return (
      <div
        className="custom-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
      >
        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          style={{
            background: "none",
            border: "1px solid #dee2e6",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "white",
            opacity: prevMonthButtonDisabled ? 0.5 : 1,
          }}
        >
          ◀
        </button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => changeMonth(parseInt(e.target.value))}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #dee2e6",
              fontSize: "14px",
              cursor: "pointer",
              backgroundColor: "white",
              fontWeight: "500",
            }}
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx}>
                {month}
              </option>
            ))}
          </select>

          {/* Year - Click to edit inline */}
          {!showYearInput ? (
            <div
              onClick={() => {
                setShowYearInput(true);
                setYearValue(currentYear.toString());
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "white",
                minWidth: "70px",
                textAlign: "center",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#3d6a8f")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#dee2e6")
              }
            >
              {currentYear}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="number"
              value={yearValue}
              onChange={(e) => setYearValue(e.target.value)}
              onKeyDown={handleYearKeyDown}
              onBlur={() => {
                let newYear = parseInt(yearValue);
                if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
                  changeYear(newYear);
                }
                setShowYearInput(false);
                setYearValue("");
              }}
              min="1900"
              max="2100"
              step="1"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "2px solid #3d6a8f",
                fontSize: "14px",
                width: "80px",
                textAlign: "center",
                outline: "none",
                fontWeight: "500",
              }}
              autoFocus
            />
          )}
        </div>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          style={{
            background: "none",
            border: "1px solid #dee2e6",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "white",
            opacity: nextMonthButtonDisabled ? 0.5 : 1,
          }}
        >
          ▶
        </button>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        open={isOpen}
        onClickOutside={() => {
          setIsOpen(false);
          setShowYearInput(false);
        }}
        onInputClick={() => setIsOpen(true)}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholderText}
        maxDate={maxDate}
        minDate={minDate}
        className={`${sizeClasses[size]} bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent cursor-pointer`}
        renderCustomHeader={(props) => <CustomHeader {...props} />}
        popperPlacement="bottom-start"
        wrapperClassName="w-full"
        showPopperArrow={false}
        popperProps={{
          strategy: "fixed",
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport",
                altAxis: true,
                padding: 8,
              },
            },
          ],
        }}
      />

      {/* Calendar Icon */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          color: "#9ca3af",
          zIndex: 1,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {/* Styles */}
      <style global="true">{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker {
          z-index: 9999 !important;
          font-family: inherit;
          border-radius: 10px !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          background-color: white !important;
          overflow: hidden !important;
        }
        .react-datepicker__day--selected {
          background-color: #3d6a8f !important;
        }
        .react-datepicker__day--selected:hover {
          background-color: #2d5a8f !important;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6 !important;
        }
        .react-datepicker__header {
          background-color: #ffffff !important;
          border-bottom: none !important;
          padding: 0 !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
        .react-datepicker__month-container {
          float: none !important;
        }
        .react-datepicker__navigation {
          top: 12px !important;
        }
      `}</style>
    </div>
  );
}
