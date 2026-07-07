// import Link from "next/link";
// import {
//   CheckCircle2,
//   CreditCard,
//   FileText,
//   ShieldCheck,
//   Wallet,
// } from "lucide-react";

// import { APP } from "@/lib/constants";
// import Container from "@/components/layout/Container";
// import SectionHeader from "@/components/common/SectionHeader";
// import { buttonVariants } from "@/components/ui/button";

// const includedFeatures = [
//   "Japanese vehicle history checking",
//   "Manual expert verification",
//   "Auction history review",
//   "Mileage history review",
//   "Professional PDF report",
//   "Dashboard report download",
//   "Email / WhatsApp / chat delivery support",
// ];

// export default function Pricing() {
//   return (
//     <section id="pricing" className="bg-background py-20 lg:py-24">
//       <Container>
//         <SectionHeader
//           badge="Simple Pricing"
//           title="One clear price for every report request"
//           description="No complicated plans. Customers pay per request and receive a verified vehicle history report prepared by our team."
//         />

//         <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
//           <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
//             <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
//               Standard Report
//             </div>

//             <div className="mt-8">
//               <p className="text-sm font-medium text-muted-foreground">
//                 Starting from
//               </p>

//               <div className="mt-2 flex items-end gap-2">
//                 <h3 className="text-5xl font-bold tracking-tight text-foreground">
//                   {APP.currency} {APP.reportPrice.toLocaleString()}
//                 </h3>

//                 <span className="pb-2 text-sm font-medium text-muted-foreground">
//                   / request
//                 </span>
//               </div>

//               <p className="mt-5 text-sm leading-7 text-muted-foreground">
//                 Perfect for customers who want to verify Japanese vehicle
//                 history before making an import or purchase decision.
//               </p>
//             </div>

//             <Link
//               href="/register"
//               className={buttonVariants({
//                 variant: "default",
//                 className: "mt-8 h-12 w-full text-base",
//               })}
//             >
//               Start Your Request
//             </Link>

//             <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
//               <div className="flex gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
//                   <Wallet className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <p className="text-sm font-semibold text-foreground">
//                     Manual and online payments
//                   </p>
//                   <p className="mt-1 text-sm leading-6 text-muted-foreground">
//                     Customers can pay manually or through the online payment
//                     gateway once enabled.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
//             <h3 className="text-2xl font-bold text-foreground">
//               What is included?
//             </h3>

//             <p className="mt-3 text-sm leading-7 text-muted-foreground">
//               Every request is handled by your team manually, so customers get a
//               verified and easy-to-understand report instead of raw confusing
//               data.
//             </p>

//             <div className="mt-8 grid gap-4 sm:grid-cols-2">
//               {includedFeatures.map((feature) => (
//                 <div key={feature} className="flex items-start gap-3">
//                   <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
//                   <span className="text-sm font-medium text-foreground">
//                     {feature}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-8 grid gap-4 sm:grid-cols-3">
//               <div className="rounded-2xl border border-border bg-background p-5">
//                 <ShieldCheck className="h-6 w-6 text-brand" />
//                 <p className="mt-4 text-sm font-semibold text-foreground">
//                   Verified
//                 </p>
//                 <p className="mt-1 text-xs leading-5 text-muted-foreground">
//                   Manual checking by admin team
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-border bg-background p-5">
//                 <FileText className="h-6 w-6 text-brand" />
//                 <p className="mt-4 text-sm font-semibold text-foreground">
//                   PDF Report
//                 </p>
//                 <p className="mt-1 text-xs leading-5 text-muted-foreground">
//                   Clean downloadable document
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-border bg-background p-5">
//                 <CreditCard className="h-6 w-6 text-brand" />
//                 <p className="mt-4 text-sm font-semibold text-foreground">
//                   Easy Payment
//                 </p>
//                 <p className="mt-1 text-xs leading-5 text-muted-foreground">
//                   Manual or online payment
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Container>
//     </section>
//   );
// }

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";
import { buttonVariants } from "@/components/ui/button";

const packages = [
  {
    name: "Starter Pack",
    price: 2500,
    requests: 1,
    description: "Best for checking one vehicle before purchase.",
  },
  {
    name: "Value Pack",
    price: 10000,
    requests: 10,
    description: "Ideal for customers checking multiple vehicles.",
    popular: true,
  },
  {
    name: "Business Pack",
    price: 20000,
    requests: 30,
    description: "Suitable for importers and regular vehicle buyers.",
  },
  {
    name: "Enterprise Pack",
    price: 50000,
    requests: 100,
    description: "Best for high-volume vehicle checking needs.",
  },
];

const includedFeatures = [
  "Japanese vehicle history checking",
  "Manual expert verification",
  "Auction history review",
  "Mileage history review",
  "Professional PDF report",
  "Dashboard report download",
  "Email / WhatsApp / chat delivery support",
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-background py-20 lg:py-24">
      <Container>
        <SectionHeader
          badge="Flexible Payment Packages"
          title="Choose a package based on how many reports you need"
          description="Instead of paying every time separately, customers can purchase request packages and use the available balance to request vehicle reports from their dashboard."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((item) => {
            const pricePerRequest = Math.round(item.price / item.requests);

            return (
              <div
                key={item.name}
                className={`relative rounded-[2rem] border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  item.popular
                    ? "border-brand shadow-brand/10"
                    : "border-border"
                }`}
              >
                {item.popular && (
                  <div className="absolute right-5 top-5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                    Popular
                  </div>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
                  <Package className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-foreground">
                  {item.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>

                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Package Price
                  </p>

                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {item.price.toLocaleString()}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-muted-foreground">
                      LKR
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.requests} report{" "}
                    {item.requests > 1 ? "requests" : "request"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Around LKR {pricePerRequest.toLocaleString()} per request
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground">
              What is included in every package?
            </h3>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Every request is handled by your team manually, so customers get a
              verified and easy-to-understand report instead of raw confusing
              data.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm font-medium text-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureBox
                icon={<ShieldCheck className="h-6 w-6 text-brand" />}
                title="Verified"
                description="Manual checking by admin team"
              />

              <FeatureBox
                icon={<FileText className="h-6 w-6 text-brand" />}
                title="PDF Report"
                description="Clean downloadable document"
              />

              <FeatureBox
                icon={<CreditCard className="h-6 w-6 text-brand" />}
                title="Easy Payment"
                description="Bank transfer or online payment"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
            <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              Package Based Requests
            </div>

            <h3 className="mt-8 text-3xl font-bold tracking-tight text-foreground">
              Buy once and request reports using your available balance
            </h3>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              After selecting a payment package, customers can pay using bank
              transfer or online payment. Once the payment is verified, the
              request balance will be added to the customer account.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                  <Wallet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bank transfer proof upload
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Customers can upload payment proof as PDF or image. Admins
                    can review and verify it from the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/payment-plans"
              className={buttonVariants({
                variant: "default",
                className: "mt-8 h-12 w-full text-base",
              })}
            >
              Purchase a Package
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FeatureBox({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      {icon}
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
