"use client";

import { useState } from "react";
import { Calendar, Search, Building2, Hash } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic data types
export interface AuctionPlatform {
  id: string;
  name: string;
  code: string;
}

export interface SearchByLotFormData {
  auctionDate: string;
  lotNumber: string;
  auctionPlatform: string;
}

interface SearchByLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (data: SearchByLotFormData) => void;
  platforms?: AuctionPlatform[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const defaultPlatforms: AuctionPlatform[] = [
  { id: "1", name: "USS Tokyo", code: "USS" },
  { id: "2", name: "TAA Kobe", code: "TAA" },
  { id: "3", name: "AUC Net", code: "AUC" },
  { id: "4", name: "HAA Osaka", code: "HAA" },
  { id: "5", name: "CAA Chiba", code: "CAA" },
];

export default function SearchByLotModal({
  isOpen,
  onClose,
  onSearch,
  platforms = defaultPlatforms,
  isLoading = false,
  title = "Search by Lot Number",
  description = "Enter the auction details to find the vehicle information",
}: SearchByLotModalProps) {
  const [formData, setFormData] = useState<SearchByLotFormData>({
    auctionDate: "",
    lotNumber: "",
    auctionPlatform: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  // ✅ FIX: Accept null and treat it as empty string
  const handleChange = (
    field: keyof SearchByLotFormData,
    value: string | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const isFormValid =
    formData.auctionDate && formData.lotNumber && formData.auctionPlatform;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Auction Date */}
        <div className="space-y-2">
          <Label htmlFor="auctionDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Auction Date
          </Label>
          <Input
            id="auctionDate"
            type="date"
            value={formData.auctionDate}
            onChange={(e) => handleChange("auctionDate", e.target.value)}
            className="h-11"
            required
          />
        </div>

        {/* Lot Number */}
        <div className="space-y-2">
          <Label htmlFor="lotNumber" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Lot Number
          </Label>
          <Input
            id="lotNumber"
            type="number"
            placeholder="Enter lot number (e.g., 12345)"
            value={formData.lotNumber}
            onChange={(e) => handleChange("lotNumber", e.target.value)}
            className="h-11"
            required
          />
        </div>

        {/* Auction Platform */}
        <div className="space-y-2">
          <Label htmlFor="auctionPlatform" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Auction Platform
          </Label>
          <Select
            value={formData.auctionPlatform}
            onValueChange={(value) => handleChange("auctionPlatform", value)}
            required
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select an auction platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name} ({platform.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="h-12 w-full text-base bg-brand hover:bg-brand/90 shadow-lg shadow-brand/30 hover:shadow-brand/40 transition-all duration-300"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Find Vehicle
            </>
          )}
        </Button>
      </form>
    </Modal>
  );
}
