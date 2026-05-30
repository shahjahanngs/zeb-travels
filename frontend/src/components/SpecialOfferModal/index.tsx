import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axios';

interface Offer {
    _id: string;
    title: string;
    image: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SpecialOfferModal({ isOpen, onClose }: Props) {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [isRendering, setIsRendering] = useState(false);
    const [animateContent, setAnimateContent] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // 1. Handle Modal Animation Lifecycle
    useEffect(() => {
        if (isOpen) {
            setIsRendering(true);
            fetchOffers();
            setTimeout(() => setAnimateContent(true), 10);
        } else {
            setAnimateContent(false);
            const timer = setTimeout(() => setIsRendering(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // 2. Fetch Offers from API
    const fetchOffers = async () => {
        try {
            const response = await axiosInstance.get("/specialOffer/getSpecialOffers");
            if (response.data.success) {
                setOffers(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. Navigation Logic
    const nextSlide = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
    }, [offers.length]);

    const prevSlide = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
    }, [offers.length]);

    // 4. Auto-Slide Logic with Pause Functionality
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        // Auto-slide logic: runs if modal is open, multiple offers exist, and NOT paused
        if (isOpen && offers.length > 1 && !isPaused) {
            interval = setInterval(() => {
                nextSlide();
            }, 3000); // 3 seconds
        }

        // Cleanup: resets the timer whenever index changes or user hovers
        return () => clearInterval(interval);
    }, [isOpen, offers.length, nextSlide, currentIndex, isPaused]);

    if (!isRendering || (offers.length === 0 && !loading)) return null;

    return (
        <div
            className={`fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${animateContent ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            {/* Modal Card */}
            <div
                className={`relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out transform ${animateContent ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="flex items-center justify-between px-4.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Limited Offer</span>
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-800 leading-tight sm:max-w-md">
                            {loading ? "Loading..." : offers[currentIndex]?.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Image Section - Added Hover Listeners here */}
                <div 
                    className="relative bg-gray-50 flex items-center justify-center overflow-hidden h-[40vh] md:h-[65vh]"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {loading ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full group">
                            {offers.map((offer, index) => (
                                <div
                                    key={offer._id}
                                    className={`absolute inset-0 p-2 transition-all duration-700 ease-in-out flex items-center justify-center
                                        ${index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}
                                        `}
                                >
                                    <img src={offer.image} alt={offer.title} className="w-full! h-full! object-contain" />
                                </div>
                            ))}

                            {/* Navigation Controls */}
                            {offers.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 sm:w-11 h-8 sm:h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-xl text-gray-800 transition-all hover:scale-110 active:scale-95 z-20"
                                    >
                                        <svg className="w-4 sm:w-6 h-4 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 sm:w-11 h-8 sm:h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-xl text-gray-800 transition-all hover:scale-110 active:scale-95 z-20"
                                    >
                                        <svg className="w-4 sm:w-6 h-4 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-full z-20">
                                        {offers.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}