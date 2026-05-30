import React, { useEffect, useState } from "react";
import axiosInstance from "../Api/axios";

interface TransportType {
    _id?: string;
    route: string;
    transportType: string;
}

const initialState: TransportType = {
    route: "",
    transportType: "",
};

export default function Transport() {
    const [transports, setTransports] = useState<
        TransportType[]
    >([]);

    const [formData, setFormData] =
        useState<TransportType>(initialState);

    const [loading, setLoading] = useState(false);

    const [editId, setEditId] = useState<string | null>(
        null
    );

    // ================= FETCH TRANSPORTS =================

    const fetchTransports = async () => {
        try {
            const res = await axiosInstance.get(
                "/transports/all"
            );

            setTransports(res.data.data || []);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchTransports();
    }, []);

    // ================= HANDLE CHANGE =================

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ================= CREATE / UPDATE =================

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            setLoading(true);

            if (editId) {
                await axiosInstance.put(
                    `/transports/update/${editId}`,
                    formData
                );

                alert("Transport updated successfully");
            } else {
                await axiosInstance.post(
                    "/transports/create",
                    formData
                );

                alert("Transport created successfully");
            }

            setFormData(initialState);

            setEditId(null);

            fetchTransports();
        } catch (error) {
            console.log(error);

            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // ================= EDIT =================

    const handleEdit = (transport: TransportType) => {
        setFormData({
            route: transport.route,
            transportType: transport.transportType,
        });

        setEditId(transport._id || null);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ================= DELETE =================

    const handleDelete = async (id?: string) => {
        if (!id) return;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this transport?"
        );

        if (!confirmDelete) return;

        try {
            await axiosInstance.delete(
                `/transports/delete/${id}`
            );

            alert("Transport deleted successfully");

            fetchTransports();
        } catch (error) {
            console.log(error);

            alert("Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* ================= HEADER ================= */}

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Transport Management
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Create, update and manage transports
                    </p>
                </div>

                {/* ================= FORM ================= */}

                <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-5">
                        {editId
                            ? "Update Transport"
                            : "Add Transport"}
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                        {/* ROUTE */}

                        <div>
                            <label className="block mb-2 font-medium">
                                Route
                            </label>

                            <input
                                type="text"
                                name="route"
                                value={formData.route}
                                onChange={handleChange}
                                placeholder="Makkah → Madinah"
                                required
                                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* TRANSPORT TYPE */}

                        <div>
                            <label className="block mb-2 font-medium">
                                Transport Type
                            </label>

                            <input
                                type="text"
                                name="transportType"
                                value={formData.transportType}
                                onChange={handleChange}
                                placeholder="Bus / GMC / Car"
                                required
                                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* BUTTONS */}

                        <div className="flex items-end gap-3 md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
                            >
                                {loading
                                    ? "Please wait..."
                                    : editId
                                        ? "Update Transport"
                                        : "Add Transport"}
                            </button>

                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditId(null);
                                        setFormData(initialState);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-3 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ================= TABLE ================= */}

                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="p-5 border-b">
                        <h2 className="text-2xl font-semibold">
                            All Transports
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left p-4">
                                        Route
                                    </th>

                                    <th className="text-left p-4">
                                        Transport Type
                                    </th>

                                    <th className="text-left p-4">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {transports.length > 0 ? (
                                    transports.map((transport) => (
                                        <tr
                                            key={transport._id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-medium">
                                                {transport.route}
                                            </td>

                                            <td className="p-4">
                                                {transport.transportType}
                                            </td>

                                            <td className="p-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(transport)
                                                        }
                                                        className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                transport._id
                                                            )
                                                        }
                                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center p-10 text-gray-500"
                                        >
                                            No transports found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}