import React from "react";
import { useNavigate } from "react-router-dom";
import aboutImg from "../../assets/images/bahrain.webp";
import { BsArrowRight, BsCheckCircleFill } from "react-icons/bs";
import { theme } from "../../theme/theme";

export default function AboutSection({ user }) {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden bg-[#f8f8f8] py-20 lg:py-28">
            {/* SVG Background */}
            <svg className="absolute left-0 top-0 h-64 w-64 text-[#D92B2B]/10" viewBox="0 0 200 200" fill="currentColor">
                <circle cx="80" cy="80" r="80" />
            </svg>

            <svg className="absolute bottom-0 right-0 h-80 w-80 text-emerald-500/10" viewBox="0 0 200 200" fill="currentColor">
                <path d="M43.5,-65.4C56.7,-59.5,68,-47.7,74.7,-33.6C81.4,-19.5,83.5,-3.1,79.5,11.6C75.5,26.3,65.4,39.3,53.4,50.8C41.4,62.3,27.5,72.3,11.7,77.2C-4.1,82.1,-21.8,81.9,-35.5,74.4C-49.2,66.9,-58.9,52.1,-66.8,36.8C-74.7,21.5,-80.8,5.7,-78.9,-9C-77,-23.7,-67.1,-37.3,-55.1,-44.1C-43.1,-50.9,-29,-50.9,-16,-57.7C-3,-64.5,8.9,-78.1,22.4,-81.1C35.9,-84.1,51,-76.5,43.5,-65.4Z" transform="translate(100 100)" />
            </svg>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    {/* Left Image */}
                    <div className="relative">
                        <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-[#D92B2B]/15" />
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-emerald-500/15" />

                        <div className="relative overflow-hidden rounded-4xl bg-white p-3 shadow-2xl">
                            <img
                                src={aboutImg}
                                alt="About ZEB Travels and Tours"
                                className="h-52! sm:h-100! w-full rounded-3xl object-cover"
                            />

                            <div className="absolute inset-3 rounded-3xl bg-linear-to-t from-black/65 via-black/10 to-transparent" />

                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="mb-3 inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#D92B2B] shadow">
                                    Trusted Travel Partner
                                </span>

                                <h2 className="text-xl sm:text-2xl font-extrabold text-white md:text-3xl">
                                    Professional Travel Services
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div>
                        <span className="mb-4 inline-flex rounded-full border border-[#D92B2B]/15 bg-[#D92B2B]/10 px-4 py-2 text-sm font-semibold text-[#D92B2B]">
                            About Company
                        </span>

                        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl md:text-4xl">
                            Trusted Travel Services with Professional Excellence
                        </h2>

                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                            ZEB Travels & Traders Pvt Ltd provides reliable travel services,
                            premium Umrah Packages, and Group Ticketing solutions with a
                            strong focus on comfort, transparency, and customer satisfaction.
                        </p>

                        <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2">
                            {[
                                "Premium Umrah Packages",
                                "Reliable Group Tickets",
                                "Professional Support",
                                "Smooth Booking Process",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-slate-800 shadow-sm"
                                >
                                    <BsCheckCircleFill className="shrink-0 text-[#D92B2B]" />
                                    <span className="text-sm font-semibold">{item}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            className="mt-10 inline-flex items-center gap-3 rounded-full px-8! py-4! text-sm font-bold text-white shadow-lg transition hover:-translate-y-1"
                            style={{ background: theme.colors.primary }}
                            onClick={() => navigate(user?._id ? "/dashboard/umrah-packages" : "/login")}
                        >
                            Discover More
                            <BsArrowRight className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}