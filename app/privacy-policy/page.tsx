import type { Metadata } from "next";
import PolicyPageShell from "@/components/policies/PolicyPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | Enfield Nexus",
  description:
    "Privacy policy explaining how Enfield Nexus collects, uses, stores, and protects customer information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageShell
      badge="Privacy Policy"
      title="Privacy Policy"
      description="This Privacy Policy explains how Enfield Nexus collects, uses, stores, protects, and handles customer information when providing vehicle information and verification support services."
      lastUpdated="July 2026"
      sections={[
        {
          title: "Information We Collect",
          content: [
            "Enfield Nexus (Pvt) Ltd may collect customer information such as name, mobile number, payment details, report request details, vehicle identifiers, auction information, documents or images submitted by the customer, and communication records related to customer support.",
            "We may also collect technical information such as device type, browser details, IP address, access time, and website usage data for security, analytics, and service improvement purposes.",
          ],
        },
        {
          title: "How We Use Customer Information",
          content: [
            "Customer information is used to create and manage customer accounts, process payments, verify report requests, prepare vehicle information reports, deliver completed reports, provide customer support, and communicate service updates.",
            "We may also use information to prevent fraud, protect our platform, improve our services, maintain business records, and comply with applicable legal or regulatory requirements.",
          ],
        },
        {
          title: "Payment Information",
          content: [
            "Online payments are processed through trusted third-party payment service providers such as PayHere. Enfield Nexus does not store full card numbers, CVV codes, or sensitive card authentication details on its systems.",
            "Payment references, transaction status, payment method, and related payment confirmation details may be stored for accounting, customer support, and service activation purposes.",
          ],
        },
        {
          title: "Sharing of Information",
          content: [
            "We do not sell, rent, or trade customer personal information to third parties. Customer information may be shared only where necessary to provide our services, process payments, maintain the platform, comply with legal obligations, or protect the rights and security of Enfield Nexus and its customers.",
            "Where service providers are used, they are expected to handle information securely and only for the purpose of providing the required service.",
          ],
        },
        {
          title: "Data Security",
          content: [
            "We take reasonable technical and organizational measures to protect customer information against unauthorized access, misuse, alteration, loss, or disclosure.",
            "However, no internet-based system can be guaranteed to be completely secure. Customers are responsible for keeping their account access, OTP codes, and device security protected.",
          ],
        },
        {
          title: "Data Retention",
          content: [
            "We retain customer information, report request details, payment references, and communication records for as long as necessary to provide services, maintain business records, resolve disputes, comply with legal obligations, and support customer service requirements.",
            "Where information is no longer required, we may delete, archive, or anonymize it in accordance with our internal procedures.",
          ],
        },
        {
          title: "Customer Rights and Requests",
          content: [
            "Customers may contact Enfield Nexus to request assistance regarding their personal information, account details, report requests, or communication records.",
            "We may require verification of identity before processing certain requests to protect customer privacy and prevent unauthorized access.",
          ],
        },
        {
          title: "Cookies and Website Usage",
          content: [
            "Our website may use cookies or similar technologies to improve user experience, maintain sessions, analyze website usage, and support security features.",
            "Customers may manage cookie preferences through their browser settings, although disabling certain cookies may affect website functionality.",
          ],
        },
        {
          title: "Changes to This Policy",
          content: [
            "Enfield Nexus may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or business operations.",
            "Updated versions will be published on this page with the revised last updated date.",
          ],
        },
      ]}
    />
  );
}
