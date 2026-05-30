import { useFormik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../Api/axios";
import ComponentCard from "../components/common/ComponentCard";
import { useParams, useNavigate } from "react-router";
import AsyncSelect from "react-select/async";
import AsyncCreatableSelect from "react-select/async-creatable";

interface Rooms {
  sharing: string;
  quad: string;
  quint: string;
  triple: string;
  double: string;
  childWithoutPackage: string;
  InfantWithoutPackage: string;
}

interface HotelForm {
  name: string;
  location: {
    city: string;
    distance?: string;
    mapUrl?: string;
  };
  rating: number;
}

interface Transport {
  route: string;
  transportType: string;
}

interface GroupTicketFlight {
  airline: string;
  flightNo: string;
  depDate: string;
  depTime: string;
  arrDate: string;
  arrTime: string;
  sectorFrom: string;
  sectorTo: string;
  fromTerminal?: string;
  toTerminal?: string;
  flightClass?: string;
  baggage?: string;
  meal?: string;
}

interface GroupTicket {
  id: string;
  groupBookingId: string;
  voucher_id: string;
  packageName?: string;
  sector: string;
  airline: string;
  totalSeats: number;
  flights: GroupTicketFlight[];
}

interface FormValues {
  packageName: string;
  supplier: string;
  logo: string;
  flightLogo: string;
  hotels: HotelForm[];
  transports: Transport[];
  rooms: Rooms;
  availableRooms?: number;
  nightCount?: string;
  notes?: string;
  days?: number;
  groupTicket: GroupTicket | null;
}

const TRANSPORT_TYPES = ["Bus", "Van", "Car", "Coaster", "Hiace", "Mini Bus", "Other"];

const sectionHeadingClass = "text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2 border-current";

const SectionHeading = ({ color, icon, title }: { color: string; icon: string; title: string }) => (
  <h4 className={`${sectionHeadingClass} ${color} flex items-center gap-1.5`}>
    <span>{icon}</span>
    <span>{title}</span>
  </h4>
);

const inputClass = "border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-1.5 w-full rounded text-xs h-8 outline-none focus:border-blue-500";
const labelClass = "block text-xs mb-1 font-medium text-gray-600 dark:text-gray-400";

const tinySelectStyles = {
  control: (base: any) => ({ ...base, minHeight: "32px", height: "32px", fontSize: "0.75rem", minWidth: "120px" }),
  valueContainer: (base: any) => ({ ...base, padding: "0 4px" }),
  input: (base: any) => ({ ...base, margin: "0", padding: "0" }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

const UpdateUmrahPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [flightLogoPreview, setFlightLogoPreview] = useState<string>("");
  const [hotelOptions, setHotelOptions] = useState<{ value: string; label: string; data?: any }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupTicketOptions, setGroupTicketOptions] = useState<{ value: string; label: string; data: GroupTicket }[]>([]);
  const [allTransports, setAllTransports] = useState<any[]>([]); // For transport auto-fill

  useEffect(() => {
    fetchHotels();
    fetchCities();
    fetchTransports(); // Fetch transports for auto-fill
    fetchGroupTickets();
    fetch("/admin-portal/data/cities.json")
      .then((res) => res.json())
      .then((data) => {
        const options = data.map((c: any) => ({
          value: c.airportCode,
          label: `${c.cityEn} (${c.airportCode})`,
        }));
        setCityOptions(options);
      })
      .catch(() => setCityOptions([]));

    if (id) {
      fetchPackageDetails(id);
    }
  }, [id]);

  // FIX 1: Hotels fetch - properly format the options
  const fetchHotels = async () => {
    try {
      const response = await axiosInstance.get("/hotels/all"); // Use /hotels/all like your add form
      if (response.data.success) {
        const formattedOptions = response.data.data.map((hotel: any) => ({
          value: hotel.hotelName,
          label: hotel.hotelName,
          data: hotel, // Store full hotel data
        }));
        setHotelOptions(formattedOptions);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  // FIX 2: Fetch transports for auto-fill
  const fetchTransports = async () => {
    try {
      const response = await axiosInstance.get("/transports/all");
      if (response.data.success) {
        setAllTransports(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching transports:", error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axiosInstance.get("/cities");
      if (response.data.success) {
        setCityOptions((prev) => [...prev, ...response.data.data]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchGroupTickets = async () => {
    try {
      const response = await axiosInstance.get("/group-ticketing");
      if (response.data.success) {
        const umrahGroups = response.data.data.filter((group: any) => group.groupType === "Umrah Groups");
        const options = umrahGroups.map((group: any) => ({
          value: group._id,
          label: `${group.groupBookingId} - ${group.packageName || group.groupName || 'N/A'}`,
          data: {
            id: group._id,
            groupBookingId: group.groupBookingId,
            voucher_id: group.voucher_id,
            packageName: group.packageName || group.groupName,
            sector: group.sector,
            airline: group.airline,
            totalSeats: group.totalSeats,
            flights: group.flights || [],
          },
        }));
        setGroupTicketOptions(options);
      }
    } catch (error) {
      console.error("Error fetching group tickets:", error);
    }
  };

  // FIX 3: Handle hotel select with auto-fill from existing hotel
  const handleHotelSelect = async (option: any, index: number) => {
    if (!option) return;

    const selectedHotel = option.data;

    if (selectedHotel) {
      // EXISTING HOTEL - auto-fill all fields
      formik.setFieldValue(`hotels[${index}]`, {
        name: selectedHotel.hotelName || "",
        location: {
          city: selectedHotel.city || "",
          distance: selectedHotel.distance?.toString() || "",
          mapUrl: selectedHotel.mapUrl || "",
        },
        rating: selectedHotel.rating || 0,
      });
    } else {
      // NEW HOTEL - just set name and create in DB
      formik.setFieldValue(`hotels[${index}].name`, option.value);
      try {
        await axiosInstance.post("/hotels/create", {
          hotelName: option.value,
          city: "",
          distance: 0,
          rating: 0,
          mapUrl: "",
        });
        toast.success("Hotel saved successfully");
        fetchHotels(); // Refresh the list
      } catch (error) {
        console.log(error);
      }
    }
  };

  // FIX 4: Handle transport route select with auto-fill
  const handleTransportRouteSelect = async (route: string, index: number) => {
    const foundTransport = allTransports.find(
      (t) => t.route?.toLowerCase() === route?.toLowerCase()
    );

    if (foundTransport) {
      // AUTO-FILL existing transport
      updateTransport(index, {
        route: foundTransport.route,
        transportType: foundTransport.transportType,
      });
    } else if (route) {
      // CREATE NEW transport
      updateTransport(index, { route });
      try {
        await axiosInstance.post("/transports/create", {
          route,
          transportType: "",
        });
        toast.success("Transport route saved successfully");
        fetchTransports(); // Refresh the list
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchPackageDetails = async (packageId: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/umrahpackages/${packageId}`);
      if (res.data.success) {
        const data = res.data.package;

        const formattedTransports = data.transports?.map((t: any) => ({
          route: t.route || "",
          transportType: t.transportType || "",
        })) || [{ route: "", transportType: "" }];

        // Make sure hotels array is valid
        const hotelsArray = data.hotels && data.hotels.length > 0
          ? data.hotels
          : [{ name: "", location: { city: "", distance: "", mapUrl: "" }, rating: 0 }];

        formik.setValues({
          packageName: data.packageName || "",
          supplier: data.supplier || "",
          logo: data.logo || "",
          flightLogo: data.flightLogo || "",
          hotels: hotelsArray,
          transports: formattedTransports,
          rooms: data.rooms || { sharing: "", quad: "", quint: "", triple: "", double: "", childWithoutPackage: "", InfantWithoutPackage: "" },
          availableRooms: data.availableRooms || 0,
          days: data.days || 0,
          nightCount: data.nightCount || "",
          notes: data.notes || "",
          groupTicket: data.groupTicket || null,
        });

        if (data.logo) setLogoPreview(data.logo);
        if (data.flightLogo) setFlightLogoPreview(data.flightLogo);
      }
    } catch (error) {
      console.error("Error fetching package:", error);
      toast.error("Failed to load package details");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<FormValues>({
    initialValues: {
      packageName: "",
      supplier: "",
      logo: "",
      flightLogo: "",
      hotels: [{ name: "", location: { city: "", distance: "", mapUrl: "" }, rating: 0 }],
      transports: [{ route: "", transportType: "" }],
      rooms: { sharing: "", quad: "", quint: "", triple: "", double: "", childWithoutPackage: "", InfantWithoutPackage: "" },
      availableRooms: 0,
      days: 0,
      nightCount: "",
      notes: "",
      groupTicket: null,
    },
    validationSchema: Yup.object({
      packageName: Yup.string().required("Package name is required"),
      supplier: Yup.string(),
      logo: Yup.string(),
      flightLogo: Yup.string(),
      hotels: Yup.array().min(1, "Select at least one hotel"),
      rooms: Yup.object({
        sharing: Yup.number().min(0),
        quad: Yup.number().min(0),
        quint: Yup.number().min(0),
        triple: Yup.number().min(0),
        double: Yup.number().min(0),
        childWithoutPackage: Yup.number().min(0),
        InfantWithoutPackage: Yup.number().min(0),
      }),
      availableRooms: Yup.number().min(0),
      days: Yup.number().min(0),
    }),
    onSubmit: async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
      try {
        const logoFile = (document.getElementById("logoInput") as HTMLInputElement)?.files?.[0];
        const flightLogoFile = (document.getElementById("flightLogoInput") as HTMLInputElement)?.files?.[0];

        const formData = new FormData();

        if (logoFile) {
          formData.append("logo", logoFile);
        }
        if (flightLogoFile) {
          formData.append("flightLogo", flightLogoFile);
        }

        formData.append("packageName", values.packageName);
        formData.append("supplier", values.supplier);
        formData.append("availableRooms", values.availableRooms?.toString() || "0");
        formData.append("days", values.days?.toString() || "0");
        formData.append("nightCount", values.nightCount || "0");
        formData.append("notes", values.notes || "");
        formData.append("hotels", JSON.stringify(values.hotels));
        formData.append("transports", JSON.stringify(values.transports));
        formData.append("rooms", JSON.stringify(values.rooms));
        if (values.groupTicket) {
          formData.append("groupTicket", JSON.stringify(values.groupTicket));
        }

        await axiosInstance.put(`/umrahpackages/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Package updated successfully!");
        setTimeout(() => navigate("/manage-package"), 1500);
      } catch (error: any) {
        console.error(error);
        const errorMessage = error.response?.data?.error ||
          error.response?.data?.message ||
          "Error saving package";
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const addTransport = () => {
    formik.setFieldValue("transports", [
      ...formik.values.transports,
      { route: "", transportType: "" },
    ]);
  };

  const removeTransport = (index: number) => {
    const updated = formik.values.transports.filter((_, i) => i !== index);
    formik.setFieldValue("transports", updated);
  };

  const updateTransport = (index: number, fields: Partial<Transport>) => {
    const updated = [...formik.values.transports];
    updated[index] = { ...updated[index], ...fields };
    formik.setFieldValue("transports", updated);
  };

  // FIX 5: loadHotelOptions - filter from hotelOptions state
  const loadHotelOptions = async (inputValue: string): Promise<any[]> => {
    if (!inputValue) return hotelOptions;

    const filtered = hotelOptions.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    return filtered;
  };

  // FIX 6: loadTransportOptions for auto-fill suggestions
  const loadTransportOptions = async (inputValue: string): Promise<any[]> => {
    if (!inputValue) {
      return allTransports.map((t: any) => ({
        value: t.route,
        label: t.route,
        data: t,
      }));
    }

    const filtered = allTransports
      .filter((t: any) => t.route?.toLowerCase().includes(inputValue.toLowerCase()))
      .map((t: any) => ({
        value: t.route,
        label: t.route,
        data: t,
      }));

    return filtered;
  };

  const loadCityOptions = async (inputValue: string): Promise<any[]> => {
    try {
      const response = await axiosInstance.get(`/cities/search?q=${inputValue}`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error loading cities:", error);
      return [];
    }
  };

  const handleCreateCity = async (inputValue: string) => {
    try {
      const response = await axiosInstance.post("/cities", { name: inputValue });
      if (response.data.success) {
        const newOption = response.data.data;
        setCityOptions([...cityOptions, newOption]);
        toast.success("City name saved!");
        return newOption;
      }
    } catch (error) {
      console.error("Error creating city:", error);
      toast.error("Failed to save city name");
    }
    return { value: inputValue, label: inputValue };
  };

  if (loading) {
    return (
      <ComponentCard title="Edit Umrah Package">
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title="Edit Umrah Package">
      <div className="rounded-xl bg-white dark:bg-gray-900">
        <form onSubmit={formik.handleSubmit} className="space-y-5 p-4">

          {/* ── Section 1: Package Basic Info ── */}
          <div>
            <SectionHeading color="text-indigo-600 dark:text-indigo-400 border-indigo-500" icon="📝" title="Package Basic Information" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Package Name</label>
                <input type="text" name="packageName" onChange={formik.handleChange} value={formik.values.packageName}
                  className={inputClass} placeholder="Enter package name" />
                {formik.touched.packageName && formik.errors.packageName && (
                  <p className="text-red-500 text-xs mt-0.5">{formik.errors.packageName}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Supplier</label>
                <input type="text" name="supplier" onChange={formik.handleChange} value={formik.values.supplier}
                  className={inputClass} placeholder="Enter supplier name" />
              </div>
              <div>
                <label className={labelClass}>Logo</label>
                <div className="border-2 border-dashed border-gray-300 p-1.5 rounded cursor-pointer text-center h-16"
                  onClick={() => document.getElementById("logoInput")?.click()}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="mx-auto h-12 object-contain" />
                    : <p className="text-xs mt-3 text-gray-400">Click to select</p>}
                </div>
                <input type="file" id="logoInput" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => { setLogoPreview(reader.result as string); formik.setFieldValue("logo", file.name); formik.setFieldTouched("logo", true); };
                    reader.readAsDataURL(file);
                  }
                }} />
                {formik.touched.logo && formik.errors.logo && <p className="text-red-500 text-xs mt-0.5">{formik.errors.logo}</p>}
              </div>
              <div>
                <label className={labelClass}>Flight Logo</label>
                <div className="border-2 border-dashed border-gray-300 p-1.5 rounded cursor-pointer text-center h-16"
                  onClick={() => document.getElementById("flightLogoInput")?.click()}>
                  {flightLogoPreview
                    ? <img src={flightLogoPreview} alt="Flight Logo" className="mx-auto h-12 object-contain" />
                    : <p className="text-xs mt-3 text-gray-400">Click to select</p>}
                </div>
                <input type="file" id="flightLogoInput" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => { setFlightLogoPreview(reader.result as string); formik.setFieldValue("flightLogo", file.name); formik.setFieldTouched("flightLogo", true); };
                    reader.readAsDataURL(file);
                  }
                }} />
                {formik.touched.flightLogo && formik.errors.flightLogo && <p className="text-red-500 text-xs mt-0.5">{formik.errors.flightLogo}</p>}
              </div>
            </div>
          </div>

          {/* ── Section 2: Package Details ── */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Available Packages</label>
                <input type="number" name="availableRooms" onChange={formik.handleChange} value={formik.values.availableRooms || ""}
                  className={inputClass} min={0} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Duration (Days)</label>
                <input type="number" name="days" onChange={formik.handleChange} value={formik.values.days || ""}
                  className={inputClass} min={0} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Night Count</label>
                <input type="text" name="nightCount" value={formik.values.nightCount || ""} onChange={formik.handleChange}
                  className={inputClass} min={0} placeholder="0" />
              </div>
            </div>
          </div>

          {/* ── Section 3: Group Ticket Selection ── */}
          <div>
            <SectionHeading color="text-emerald-600 dark:text-emerald-400 border-emerald-500" icon="🎫" title="Link Group Ticket" />
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelClass}>Select Umrah Group Ticket</label>
                <AsyncSelect
                  isClearable
                  cacheOptions
                  defaultOptions={groupTicketOptions}
                  value={formik.values.groupTicket ? {
                    value: formik.values.groupTicket.id,
                    label: `${formik.values.groupTicket.groupBookingId} - ${formik.values.groupTicket.packageName}`,
                  } : null}
                  onChange={(option: any) => {
                    if (option) {
                      formik.setFieldValue("groupTicket", option.data);
                    } else {
                      formik.setFieldValue("groupTicket", null);
                    }
                  }}
                  loadOptions={async (inputValue: string) => {
                    const input = inputValue.toLowerCase();
                    return groupTicketOptions.filter((opt: any) =>
                      opt.label.toLowerCase().includes(input)
                    );
                  }}
                  placeholder="Select a group ticket..."
                  className="text-sm"
                  styles={tinySelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {groupTicketOptions.length > 0
                    ? `${groupTicketOptions.length} Umrah Group(s) available`
                    : "No Umrah Groups found"}
                </p>
              </div>

              {/* Display Group Ticket Flight Info when selected */}
              {formik.values.groupTicket && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Linked Group Ticket Info</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                    <div>
                      <span className="font-medium text-gray-500">Sector:</span>
                      <p className="text-gray-800 dark:text-gray-200">{formik.values.groupTicket.sector || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Airline:</span>
                      <p className="text-gray-800 dark:text-gray-200">{formik.values.groupTicket.airline || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Total Seats:</span>
                      <p className="text-gray-800 dark:text-gray-200">{formik.values.groupTicket.totalSeats || 0}</p>
                    </div>
                  </div>
                  {formik.values.groupTicket.flights && formik.values.groupTicket.flights.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-500 text-xs">Flight Details:</span>
                      <div className="mt-1 space-y-1">
                        {formik.values.groupTicket.flights.map((flight, idx) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                            {flight.flightNo} | {flight.sectorFrom} → {flight.sectorTo} | Dep: {flight.depDate?.split('T')[0]} {flight.depTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Sections 4 & 5: Hotel + Transport side by side ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Hotel - FIXED with handleHotelSelect */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeading color="text-green-600 dark:text-green-400 border-green-500" icon="🏨" title="Hotel Information" />
                <button type="button"
                  onClick={() => formik.setFieldValue("hotels", [...formik.values.hotels, { name: "", location: { city: "", distance: "", mapUrl: "" }, rating: 0 }])}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {formik.values.hotels.map((hotel, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Hotel Name</label>
                        <AsyncCreatableSelect
                          cacheOptions
                          defaultOptions={hotelOptions}
                          loadOptions={loadHotelOptions}
                          onCreateOption={(inputValue) => {
                            handleHotelSelect({ value: inputValue, label: inputValue }, index);
                          }}
                          onChange={(option: any) => handleHotelSelect(option, index)}
                          value={hotel.name ? { value: hotel.name, label: hotel.name } : null}
                          placeholder="Type hotel..."
                          className="text-xs"
                          styles={tinySelectStyles}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>City</label>
                        <AsyncCreatableSelect cacheOptions loadOptions={loadCityOptions}
                          onCreateOption={(inputValue) => { handleCreateCity(inputValue); formik.setFieldValue(`hotels[${index}].location.city`, inputValue); }}
                          onChange={(option: any) => formik.setFieldValue(`hotels[${index}].location.city`, option?.value || "")}
                          value={hotel.location.city ? { value: hotel.location.city, label: hotel.location.city } : null}
                          placeholder="Type city..." className="text-xs" styles={tinySelectStyles} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Distance (m)</label>
                        <input type="text" name={`hotels[${index}].location.distance`} value={hotel.location.distance}
                          onChange={formik.handleChange} className={inputClass} placeholder="500" />
                      </div>
                      <div>
                        <label className={labelClass}>Rating</label>
                        <input type="number" name={`hotels[${index}].rating`} value={hotel.rating}
                          onChange={formik.handleChange} className={inputClass} min={0} max={5} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Map URL</label>
                        <div className="flex gap-1">
                          <input type="text" name={`hotels[${index}].location.mapUrl`} value={hotel.location.mapUrl}
                            onChange={formik.handleChange} className={inputClass} placeholder="Google Maps URL" />
                          {index !== 0 && (
                            <button type="button" onClick={() => {
                              const newHotels = [...formik.values.hotels];
                              newHotels.splice(index, 1);
                              formik.setFieldValue("hotels", newHotels);
                            }} className="text-red-500 hover:text-red-700 px-1 text-xs">✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport - FIXED with AsyncCreatableSelect for auto-fill */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeading color="text-orange-600 dark:text-orange-400 border-orange-500" icon="🚐" title="Transport Information" />
                <button type="button" onClick={addTransport}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700">
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {formik.values.transports.map((transport, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Route</label>
                        <AsyncCreatableSelect
                          cacheOptions
                          defaultOptions={allTransports.map((t: any) => ({
                            value: t.route,
                            label: t.route,
                            data: t,
                          }))}
                          loadOptions={loadTransportOptions}
                          onCreateOption={(inputValue) => handleTransportRouteSelect(inputValue, index)}
                          onChange={(option: any) => handleTransportRouteSelect(option?.value || "", index)}
                          value={transport.route ? { value: transport.route, label: transport.route } : null}
                          placeholder="LHE-JED-MED"
                          className="text-xs"
                          styles={tinySelectStyles}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Type</label>
                        <div className="flex gap-1 items-center">
                          <select value={transport.transportType}
                            onChange={(e) => updateTransport(index, { transportType: e.target.value })}
                            className={inputClass}>
                            <option value="">Select type</option>
                            {TRANSPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {index !== 0 && (
                            <button type="button" onClick={() => removeTransport(index)}
                              className="text-red-500 hover:text-red-700 text-xs px-1 whitespace-nowrap">✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section 6: Room Pricing – single row ── */}
          <div>
            <SectionHeading color="text-pink-600 dark:text-pink-400 border-pink-500" icon="💰" title="Room Pricing" />
            <div className="flex flex-wrap gap-2">
              {(["sharing", "quint", "quad", "triple", "double", "childWithoutPackage", "InfantWithoutPackage"] as const).map((type) => (
                <div key={type} className="flex-1 min-w-22.5">
                  <label className="block capitalize text-xs mb-1 font-medium text-gray-600 dark:text-gray-400">{type}</label>
                  <input
                    type="text"
                    name={`rooms.${type}`}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (!isNaN(Number(raw))) formik.setFieldValue(`rooms.${type}`, raw);
                    }}
                    value={formik.values.rooms[type] ? Number(formik.values.rooms[type]).toLocaleString() : ""}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* ── Special Notes ── */}
          <div>
            <label className={labelClass}>Special Optional Notes</label>
            <input type="text" name="notes" value={formik.values.notes || ""} onChange={formik.handleChange}
              className={inputClass} placeholder="Enter Special notes" />
          </div>

          {/* ── Submit Buttons ── */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm">
              Update Package
            </button>
          </div>
        </form>
      </div>
      <ToastContainer style={{ zIndex: 9999999 }} />
    </ComponentCard>
  );
};

export default UpdateUmrahPackage;
