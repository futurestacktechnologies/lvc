"use client";

import { useState } from "react";
import Hero from "@/features/home/sections/Hero";
import HowItWorks from "@/features/home/sections/HowItWorks";
import ReportFeatures from "@/features/home/sections/ReportFeatures";
import Pricing from "@/features/home/sections/Pricing";
import FAQ from "@/features/home/sections/FAQ";
import CTA from "@/features/home/sections/CTA";
import SearchByLotModal, {
  SearchByLotFormData,
} from "@/components/common/SearchByLotModal";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (data: SearchByLotFormData) => {
    setIsLoading(true);
    console.log("Searching with:", data);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      // Navigate or show result
    }, 2000);
  };

  return (
    <>
      <Hero onSearchByLotClick={() => setIsModalOpen(true)} />
      <HowItWorks />
      <ReportFeatures />
      <Pricing />
      <FAQ />
      <CTA />

      {/* Modal */}
      <SearchByLotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
        isLoading={isLoading}
        platforms={[
          { id: "uss", name: "USS Tokyo", code: "USS" },
          { id: "taa", name: "TAA Kobe", code: "TAA" },
          { id: "auc", name: "AUC Net", code: "AUC" },
        ]}
        title="Search by Lot Number"
        description="Enter auction details to find the vehicle"
      />
    </>
  );
}
