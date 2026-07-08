"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileImage,
  FileText,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CreateReportDialogProps = {
  requestId: string;
  requestNumber: string;
  vehicleIdentifier: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_ACCIDENT_PHOTOS = 6;

export default function CreateReportDialog({
  requestId,
  requestNumber,
  vehicleIdentifier,
}: CreateReportDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [auctionSheetImage, setAuctionSheetImage] = useState<File | null>(null);
  const [accidentPhotos, setAccidentPhotos] = useState<File[]>([]);

  const [formValues, setFormValues] = useState({
    reportTitle: `${requestNumber} Vehicle Report`,
    vehicleMake: "",
    vehicleModel: "",
    modelYear: "",
    mileage: "",
    color: "",
    auctionGrade: "",

    originalJapanPrice: "",
    sriLankaEstimatedPrice: "",
    sriLankaMarketAverageValuation: "",
    valuationNotes: "",

    conditionSummary: "",
    notes: "",
  });

  function updateField(name: keyof typeof formValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function formatFileSize(size: number) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  function validateImage(file: File) {
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      /\.(jpg|jpeg|png)$/i.test(file.name);

    if (!isValidType) {
      return "Only JPG and PNG images are allowed.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Each image must be less than 5MB.";
    }

    return null;
  }

  function handleAuctionSheetChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setAuctionSheetImage(null);
      return;
    }

    const error = validateImage(file);

    if (error) {
      toast.error("Invalid auction sheet image", {
        description: error,
      });

      event.target.value = "";
      setAuctionSheetImage(null);
      return;
    }

    setAuctionSheetImage(file);
  }

  function handleAccidentPhotosChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const error = validateImage(file);

      if (error) {
        toast.error("Invalid accident photo", {
          description: `${file.name}: ${error}`,
        });
        continue;
      }

      validFiles.push(file);
    }

    setAccidentPhotos((current) => {
      const mergedFiles = [...current, ...validFiles];

      if (mergedFiles.length > MAX_ACCIDENT_PHOTOS) {
        toast.error("Too many photos", {
          description: `You can upload maximum ${MAX_ACCIDENT_PHOTOS} accident photos.`,
        });
      }

      return mergedFiles.slice(0, MAX_ACCIDENT_PHOTOS);
    });

    event.target.value = "";
  }

  function removeAccidentPhoto(index: number) {
    setAccidentPhotos((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.reportTitle.trim()) {
      toast.error("Report title required", {
        description: "Please enter a report title.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      Object.entries(formValues).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (auctionSheetImage) {
        formData.append("auctionSheetImage", auctionSheetImage);
      }

      accidentPhotos.forEach((file) => {
        formData.append("accidentPhotos", file);
      });

      const response = await fetch(
        `/api/admin/report-requests/${requestId}/reports/create`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Create report failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Report created", {
        description:
          result.message ||
          "PDF report created successfully. You can review it before delivering.",
      });

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Create report failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-11 w-full cursor-pointer rounded-2xl"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] sm:max-w-3xl">
          <DialogHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
              <FileText className="h-6 w-6" />
            </div>

            <DialogTitle>Create PDF Report</DialogTitle>

            <DialogDescription>
              Fill the report details, add auction sheet and damage photos. The
              PDF will be created under Uploaded Reports for review before
              delivery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <section className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Basic Vehicle Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reportTitle">Report title</Label>
                  <Input
                    id="reportTitle"
                    value={formValues.reportTitle}
                    onChange={(event) =>
                      updateField("reportTitle", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Request vehicle identifier</Label>
                  <Input
                    value={vehicleIdentifier}
                    disabled
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleMake">Vehicle make</Label>
                  <Input
                    id="vehicleMake"
                    placeholder="Toyota"
                    value={formValues.vehicleMake}
                    onChange={(event) =>
                      updateField("vehicleMake", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Vehicle model</Label>
                  <Input
                    id="vehicleModel"
                    placeholder="Aqua"
                    value={formValues.vehicleModel}
                    onChange={(event) =>
                      updateField("vehicleModel", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelYear">Model year</Label>
                  <Input
                    id="modelYear"
                    placeholder="2019"
                    value={formValues.modelYear}
                    onChange={(event) =>
                      updateField("modelYear", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    placeholder="45,000 km"
                    value={formValues.mileage}
                    onChange={(event) =>
                      updateField("mileage", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="White"
                    value={formValues.color}
                    onChange={(event) =>
                      updateField("color", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auctionGrade">Auction grade</Label>
                  <Input
                    id="auctionGrade"
                    placeholder="4.5"
                    value={formValues.auctionGrade}
                    onChange={(event) =>
                      updateField("auctionGrade", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Price & Valuation
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="originalJapanPrice">
                    Original price in Japan
                  </Label>
                  <Input
                    id="originalJapanPrice"
                    placeholder="JPY 850,000"
                    value={formValues.originalJapanPrice}
                    onChange={(event) =>
                      updateField("originalJapanPrice", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sriLankaEstimatedPrice">
                    Estimated price in Sri Lanka
                  </Label>
                  <Input
                    id="sriLankaEstimatedPrice"
                    placeholder="LKR 8,500,000"
                    value={formValues.sriLankaEstimatedPrice}
                    onChange={(event) =>
                      updateField("sriLankaEstimatedPrice", event.target.value)
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sriLankaMarketAverageValuation">
                    Sri Lankan market average valuation
                  </Label>
                  <Input
                    id="sriLankaMarketAverageValuation"
                    placeholder="LKR 9,200,000 - LKR 9,800,000"
                    value={formValues.sriLankaMarketAverageValuation}
                    onChange={(event) =>
                      updateField(
                        "sriLankaMarketAverageValuation",
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="valuationNotes">Valuation notes</Label>
                  <textarea
                    id="valuationNotes"
                    placeholder="Explain price calculation, market comparison, taxes, condition impact, etc."
                    value={formValues.valuationNotes}
                    onChange={(event) =>
                      updateField("valuationNotes", event.target.value)
                    }
                    className="min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Report Notes
              </h3>

              <div className="space-y-2">
                <Label htmlFor="conditionSummary">Condition summary</Label>
                <textarea
                  id="conditionSummary"
                  placeholder="Enter vehicle condition summary..."
                  value={formValues.conditionSummary}
                  onChange={(event) =>
                    updateField("conditionSummary", event.target.value)
                  }
                  className="min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional notes</Label>
                <textarea
                  id="notes"
                  placeholder="Enter additional notes..."
                  value={formValues.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Images</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auctionSheetImage">Auction sheet image</Label>

                  <label
                    htmlFor="auctionSheetImage"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center transition hover:border-brand hover:bg-secondary/40"
                  >
                    <FileImage className="h-8 w-8 text-brand" />
                    <span className="mt-2 text-sm font-semibold">
                      Upload auction sheet
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      JPG or PNG, max 5MB
                    </span>
                  </label>

                  <input
                    id="auctionSheetImage"
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={handleAuctionSheetChange}
                    className="hidden"
                  />

                  {auctionSheetImage && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {auctionSheetImage.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(auctionSheetImage.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAuctionSheetImage(null)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accidentPhotos">
                    Accident / damage photos
                  </Label>

                  <label
                    htmlFor="accidentPhotos"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center transition hover:border-brand hover:bg-secondary/40"
                  >
                    <FileImage className="h-8 w-8 text-brand" />
                    <span className="mt-2 text-sm font-semibold">
                      Upload damage photos
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Maximum {MAX_ACCIDENT_PHOTOS} photos, JPG or PNG
                    </span>
                  </label>

                  <input
                    id="accidentPhotos"
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleAccidentPhotosChange}
                    className="hidden"
                  />

                  {accidentPhotos.length > 0 && (
                    <div className="space-y-2">
                      {accidentPhotos.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAccidentPhoto(index)}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-2xl"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-2xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create PDF Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
