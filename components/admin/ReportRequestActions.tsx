"use client";

import {
  CheckCircle2,
  FileUp,
  LoaderCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import { Button } from "@/components/ui/button";

type ReportRequestStatusValue =
  | "NEW"
  | "PROCESSING"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

type ReportRequestActionsProps = {
  requestId: string;
  requestNumber: string;
  status: ReportRequestStatusValue;
  uploadedReportsCount: number;
};

export default function ReportRequestActions({
  requestId,
  requestNumber,
  status,
  uploadedReportsCount,
}: ReportRequestActionsProps) {
  const canReject =
    status !== "REJECTED" && status !== "CANCELLED" && status !== "DELIVERED";

  const canDeliver = status === "PROCESSING" || status === "COMPLETED";

  function showUploadRequiredToast() {
    toast.error("PDF report required", {
      description:
        "Please upload the final PDF report before delivering this request.",
    });
  }

  return (
    <div className="space-y-3">
      {status === "NEW" && (
        <ActionConfirmDialog
          title="Start processing this request?"
          description={`Are you sure you want to start processing ${requestNumber}? This request will be assigned to you.`}
          confirmLabel="Yes, Start Processing"
          confirmVariant="default"
          actionUrl={`/api/admin/report-requests/${requestId}/status`}
          hiddenFields={{
            status: "PROCESSING",
          }}
          successTitle="Request updated"
          successDescription="Report request has been moved to processing."
          errorTitle="Update failed"
          icon={<LoaderCircle className="h-6 w-6" />}
          trigger={
            <Button type="button" className="w-full cursor-pointer">
              <LoaderCircle className="mr-2 h-4 w-4" />
              Mark as Processing
            </Button>
          }
        />
      )}

      {canDeliver &&
        (uploadedReportsCount > 0 ? (
          <ActionConfirmDialog
            title="Deliver this report?"
            description={`Are you sure you want to deliver ${requestNumber}? The customer will be able to see the uploaded PDF report.`}
            confirmLabel="Yes, Deliver Report"
            confirmVariant="default"
            actionUrl={`/api/admin/report-requests/${requestId}/status`}
            hiddenFields={{
              status: "DELIVERED",
            }}
            successTitle="Report delivered"
            successDescription="The report has been delivered to the customer."
            errorTitle="Delivery failed"
            icon={<CheckCircle2 className="h-6 w-6" />}
            trigger={
              <Button type="button" className="w-full cursor-pointer">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Delivered
              </Button>
            }
          />
        ) : (
          <Button
            type="button"
            onClick={showUploadRequiredToast}
            className="w-full cursor-pointer"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Mark as Delivered
          </Button>
        ))}

      {canReject && (
        <ActionConfirmDialog
          title="Reject this request?"
          description={`Please enter the reason for rejecting ${requestNumber}. The customer will be able to see this reason from the customer dashboard.`}
          confirmLabel="Yes, Reject Request"
          confirmVariant="destructive"
          actionUrl={`/api/admin/report-requests/${requestId}/status`}
          hiddenFields={{
            status: "REJECTED",
          }}
          textareaField={{
            name: "reason",
            label: "Reject reason",
            placeholder:
              "Example: The provided vehicle identifier is invalid or the auction details cannot be verified.",
            required: true,
            minLength: 5,
          }}
          successTitle="Request rejected"
          successDescription="Report request has been rejected and the reason was saved."
          errorTitle="Reject failed"
          icon={<ShieldAlert className="h-6 w-6" />}
          trigger={
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Request
            </Button>
          }
        />
      )}
    </div>
  );
}
