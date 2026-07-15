import type { Metadata } from "next";
import PolicyPageShell from "@/components/policies/PolicyPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions | Enfield Nexus",
  description:
    "Terms and conditions for using Enfield Nexus vehicle history checking and report services.",
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyPageShell
      badge="Business Terms"
      title="Terms & Conditions"
      description="These Terms & Conditions govern the use of Enfield Nexus services, website, customer accounts, payments, report requests, and related vehicle information support services."
      lastUpdated="July 2026"
      sections={[
        {
          title: "Introduction",
          content: [
            "These Terms & Conditions apply to all customers who access, use, purchase, or request services from Enfield Nexus (Pvt) Ltd. By using our website, creating an account, making a payment, or submitting a report request, the customer agrees to these terms.",
            "Enfield Nexus provides vehicle information, verification support, and vehicle history report services based on available vehicle-related information and details submitted by the customer.",
          ],
        },
        {
          title: "Use of Our Services",
          content: [
            "Customers must provide accurate, complete, and current information when creating an account, submitting a vehicle report request, making a payment, or communicating with our support team.",
            "Customers must not use our website or services for unlawful, fraudulent, misleading, abusive, or unauthorized purposes.",
          ],
        },
        {
          title: "Customer Account Responsibility",
          content: [
            "Customers are responsible for maintaining the confidentiality and security of their account access, registered mobile number, OTP codes, and related login information.",
            "Enfield Nexus will not be responsible for unauthorized access caused by the customer sharing OTP codes, login details, or device access with another party.",
          ],
        },
        {
          title: "Report Requests and Customer Information",
          content: [
            "Customers are responsible for submitting correct vehicle details such as chassis number, auction details, lot number, registration information, images, or any other required information depending on the requested service.",
            "Incorrect, incomplete, or unclear information may delay processing or affect the accuracy and completeness of the final report.",
          ],
        },
        {
          title: "Service Limitations",
          content: [
            "Vehicle information reports are prepared using available records, submitted details, accessible references, and verification support processes. Enfield Nexus does not guarantee that every vehicle record, historical detail, defect, incident, or ownership-related matter will be available or discoverable.",
            "Our reports are provided for customer information and decision-support purposes only. Customers should not treat the report as a legal guarantee, official government certification, insurance assessment, or final confirmation of a vehicle’s condition or value.",
          ],
        },
        {
          title: "Payments and Packages",
          content: [
            "Customers may purchase report requests, service packages, or related verification support services through the payment methods available on our website.",
            "Service activation may depend on successful payment confirmation. Enfield Nexus reserves the right to delay or decline processing where payment is incomplete, failed, suspicious, or not verified.",
          ],
        },
        {
          title: "Delivery of Reports",
          content: [
            "Completed reports may be delivered through the customer account, email, online chat, or another official communication method used by Enfield Nexus.",
            "Estimated delivery times are provided as guidance only and may vary depending on the complexity of the request, availability of information, customer response time, payment confirmation, and operational factors.",
          ],
        },
        {
          title: "Refunds and Cancellations",
          content: [
            "Refunds, cancellations, and duplicate payment concerns are handled according to our Refund & Return Policy published on our website.",
            "Customers are encouraged to review the Refund & Return Policy before purchasing a service or package.",
          ],
        },
        {
          title: "Intellectual Property",
          content: [
            "All website content, branding, design elements, report formats, text, graphics, logos, and platform materials are owned by or licensed to Enfield Nexus unless otherwise stated.",
            "Customers may not copy, reproduce, distribute, resell, modify, or misuse any content, report format, or material from our website without written permission from Enfield Nexus.",
          ],
        },
        {
          title: "Limitation of Liability",
          content: [
            "Enfield Nexus shall not be liable for indirect, incidental, consequential, or financial losses arising from customer decisions made based on a report, delays caused by third parties, unavailable records, inaccurate customer-submitted information, or technical interruptions.",
            "Customers are responsible for making their own final purchasing, importing, selling, or valuation decisions and may seek additional professional inspection or legal advice where necessary.",
          ],
        },
        {
          title: "Changes to Terms",
          content: [
            "Enfield Nexus may update, modify, or replace these Terms & Conditions from time to time. Updated terms will be published on this page with the revised last updated date.",
            "Continued use of our services after changes are published constitutes acceptance of the updated terms.",
          ],
        },
      ]}
    />
  );
}
