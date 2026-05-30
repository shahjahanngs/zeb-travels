import React from "react";
import {
    FaPlaneDeparture,
    FaKaaba,
    FaPassport,
    FaHotel,
    FaMapMarkedAlt,
    FaHandsHelping,
} from "react-icons/fa";

import service1 from "../../assets/images/service1.webp";
import service2 from "../../assets/images/service2.webp";
import service3 from "../../assets/images/service3.webp";
import service4 from "../../assets/images/service4.webp";
import service5 from "../../assets/images/service5.webp";
import service6 from "../../assets/images/service6.webp";

const services = [
    {
        id: 1,
        title: "Air Tickets",
        description:
            "We arrange safe, comfortable air tickets, activities, and hotels for your stay.",
        image: service1,
        icon: FaPlaneDeparture,
    },
    {
        id: 2,
        title: "Umrah Packages",
        description:
            "We offer Umrah travel packages for groups and affordable deals with top service quality.",
        image: service2,
        icon: FaKaaba,
    },
    {
        id: 3,
        title: "Visa Services",
        description:
            "Efficient visa services for seamless international travel with expert guidance.",
        image: service3,
        icon: FaPassport,
    },
    {
        id: 4,
        title: "Hotel Packages",
        description:
            "Luxurious hotel stays with curated experiences at top destinations worldwide.",
        image: service4,
        icon: FaHotel,
    },
    {
        id: 5,
        title: "Travel Consultancy",
        description:
            "Expert guidance, personalized bookings, and travel tips for unforgettable adventures.",
        image: service5,
        icon: FaMapMarkedAlt,
    },
    {
        id: 6,
        title: "Meet & Assist",
        description:
            "Seamless meet and assist services for stress-free airport experiences.",
        image: service6,
        icon: FaHandsHelping,
    },
];

export default function ServicesSection() {
    return (
        <section className="relative overflow-hidden bg-white py-20 lg:py-28">
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <span className="mb-4 inline-flex rounded-full border border-[#D92B2B]/15 bg-[#D92B2B]/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-[#D92B2B]">
                        Our Expertise
                    </span>

                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                        Services We Provide
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
                        Complete travel solutions designed for smooth bookings, comfortable
                        journeys, and reliable customer support.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => {
                        const Icon = service.icon;

                        return (
                            <div
                                key={service.id}
                                className="group overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                    />

                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

                                    <div className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#D92B2B] shadow-lg">
                                        <Icon className="text-2xl" />
                                    </div>
                                </div>

                                <div className="p-7">
                                    <h3 className="text-2xl font-extrabold text-slate-950">
                                        {service.title}
                                    </h3>

                                    <p className="mt-3 text-[15px] leading-7 text-slate-600">
                                        {service.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}