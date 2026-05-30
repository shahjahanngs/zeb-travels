import React from "react";
import { BiSolidPlane } from "react-icons/bi";
import { FaGlobe, FaKaaba, FaHotel } from "react-icons/fa";
import { theme } from "../../theme/theme";

const features = [
    {
        title: "Airline Tickets",
        desc: "Get instant access to worldwide destinations with competitive pricing and 24/7 booking support.",
        icon: BiSolidPlane,
    },
    {
        title: "Visa Services",
        desc: "Simplify your travel with our high-success visa processing and expert documentation handling.",
        icon: FaGlobe,
    },
    {
        title: "Umrah Packages",
        desc: "All-inclusive, spiritually-focused packages with premium locations and seamless logistics.",
        icon: FaKaaba,
    },
    {
        title: "Hotel Booking",
        desc: "From luxury resorts to budget stays, we offer trusted accommodations at exclusive rates.",
        icon: FaHotel,
    },
];

export default function ChooseUsSection() {
    return (
        <section className="relative overflow-hidden bg-[#f8f8f8] py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="mb-4 inline-flex rounded-full border border-[#D92B2B]/15 bg-[#D92B2B]/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-[#D92B2B]">
                        Why Choose Us
                    </span>

                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                        Why Choose ZEB Travels & Traders
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
                        We provide complete travel solutions including airline tickets,
                        visas, Umrah packages, and hotel bookings with reliable support and
                        professional service quality.
                    </p>
                </div>

                {/* Cards */}
                <div className="mt-14 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={index}
                                className="group relative overflow-hidden rounded-4xl border border-slate-100 bg-white p-7 text-center shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D92B2B]/10 text-[#D92B2B] transition duration-500 group-hover:scale-110 group-hover:bg-[#D92B2B] group-hover:text-white">
                                    <Icon className="text-3xl" />
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-slate-950">
                                    {item.title}
                                </h3>

                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {item.desc}
                                </p>

                                <div
                                    className="mx-auto mt-6 h-1 w-12 rounded-full transition-all duration-500 group-hover:w-20"
                                    style={{ background: theme.colors.primary }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}