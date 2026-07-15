import type { Metadata } from "next";
import PolicyPageShell from "@/components/policies/PolicyPageShell";

export const metadata: Metadata = {
  title: "Refund & Return Policy | Enfield Nexus",
  description:
    "Refund and return policy for Enfield Nexus vehicle history checking and report services.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyPageShell
      badge="Refund Policy"
      title="Refund & Return Policy"
      description="This policy explains how refunds, cancellations, duplicate payments, and service-related payment concerns are handled for Enfield Nexus vehicle history checking and report services."
      lastUpdated="July 2026"
      sections={[
        {
          title: "Nature of Our Services",
          content: [
            "Enfield Nexus (Pvt) Ltd provides vehicle information, verification support, and vehicle history report services. Our services are primarily digital and service-based, where customers submit vehicle details and receive a professionally prepared report or related verification support.",
            "As our services involve manual review, checking, processing, and preparation of vehicle-related information, the return process applicable to physical products does not apply to our services.",
          ],
        },
        {
          title: "Service Delivery",
          content: [
            "After successful payment and submission of the required vehicle details, we begin processing the customer’s report request. Standard service delivery is usually completed within the estimated time mentioned on our website or communicated to the customer.",
            "Delivery time may vary depending on the availability of vehicle information, accuracy of details submitted by the customer, payment verification, and the complexity of the request.",
          ],
        },
        {
          title: "Refund Eligibility",
          content: [
            "A refund may be considered if a duplicate payment has been made, an incorrect amount has been charged due to a technical error, or if Enfield Nexus is unable to process the requested service due to an internal issue.",
            "Refund requests must be submitted to our support team with the payment reference, registered mobile number, and reason for the refund request.",
          ],
        },
        {
          title: "Non-Refundable Situations",
          content: [
            "Payments are generally non-refundable once the report request has been accepted for processing, the report has been prepared, or the service has been delivered to the customer.",
            "Refunds will not be issued where incorrect, incomplete, or inaccurate vehicle details were submitted by the customer, or where the customer changes their mind after the service has already started.",
          ],
        },
        {
          title: "Cancellations",
          content: [
            "A customer may request cancellation before the report processing begins. If the request has not yet entered processing, Enfield Nexus may approve a cancellation and refund at its discretion.",
            "Once the verification or report preparation process has started, cancellation may not be possible due to the service-based nature of the work.",
          ],
        },
        {
          title: "Refund Processing Time",
          content: [
            "Approved refunds will be processed using the original payment method where possible. Refund processing may take 7 to 14 business days, depending on the payment provider, bank, or payment gateway involved.",
            "Enfield Nexus is not responsible for delays caused by banks, payment processors, or third-party payment gateway providers after the refund has been initiated.",
          ],
        },
        {
          title: "Contact for Refund Requests",
          content: [
            "For refund or payment-related concerns, customers may contact Enfield Nexus support through the contact details provided on our website. Customers should include the payment reference, package or request details, and the registered mobile number used for the transaction.",
          ],
        },
      ]}
    />
  );
}
