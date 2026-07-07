// import Link from "next/link";
// import { ArrowLeft, CheckCircle2, Package, Sparkles } from "lucide-react";

// import { getCurrentUser } from "@/lib/auth/current-user";
// import { prisma } from "@/lib/prisma/client";
// import { Button, buttonVariants } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// export default async function PaymentPlansPage() {
//   const user = await getCurrentUser();

//   const backHref = user ? "/dashboard" : "/";
//   const backLabel = user ? "Back to Dashboard" : "Back to Home";

//   const plans = await prisma.paymentPlan.findMany({
//     where: {
//       isActive: true,
//     },
//     orderBy: {
//       sortOrder: "asc",
//     },
//   });

//   return (
//     <main className="min-h-screen bg-muted/40">
//       <section className="mx-auto max-w-7xl px-6 py-10">
//         <div className="mb-8">
//           <Link
//             href={backHref}
//             className={buttonVariants({ variant: "outline" })}
//           >
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             {backLabel}
//           </Link>
//         </div>

//         <div className="mx-auto max-w-3xl text-center">
//           <Badge className="mb-4 gap-2">
//             <Sparkles className="h-4 w-4" />
//             Payment Plans
//           </Badge>

//           <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
//             Select a package to request vehicle reports
//           </h1>

//           <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
//             Choose a request package based on how many vehicle reports you need.
//             After payment verification, your request balance will be added to
//             your account.
//           </p>
//         </div>

//         <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
//           {plans.map((plan) => {
//             const pricePerRequest = Math.round(
//               plan.price / plan.requestCredits,
//             );

//             const isPopular = plan.code === "VALUE_10";

//             const selectHref = user ? `/payment-plans/${plan.code}` : "/login";

//             return (
//               <Card
//                 key={plan.id}
//                 className={`relative flex flex-col overflow-hidden rounded-[2rem] ${
//                   isPopular ? "border-brand shadow-xl shadow-brand/10" : ""
//                 }`}
//               >
//                 {isPopular && (
//                   <div className="absolute right-5 top-5">
//                     <Badge>Popular</Badge>
//                   </div>
//                 )}

//                 <CardHeader className="pb-4">
//                   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
//                     <Package className="h-6 w-6" />
//                   </div>

//                   <div className="mt-6">
//                     <h2 className="text-xl font-bold text-foreground">
//                       {plan.name}
//                     </h2>

//                     <p className="mt-2 text-sm text-muted-foreground">
//                       {plan.requestCredits} report{" "}
//                       {plan.requestCredits > 1 ? "requests" : "request"}
//                     </p>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="flex-1">
//                   <div>
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Package Price
//                     </p>

//                     <div className="mt-2 flex items-end gap-1">
//                       <span className="text-4xl font-bold tracking-tight text-foreground">
//                         {plan.price.toLocaleString()}
//                       </span>
//                       <span className="pb-1 text-sm font-semibold text-muted-foreground">
//                         {plan.currency}
//                       </span>
//                     </div>

//                     <p className="mt-2 text-sm text-muted-foreground">
//                       Around LKR {pricePerRequest.toLocaleString()} per request
//                     </p>
//                   </div>

//                   <div className="mt-6 space-y-3">
//                     <PlanFeature>
//                       {plan.requestCredits} vehicle report request credits
//                     </PlanFeature>

//                     <PlanFeature>Dashboard request tracking</PlanFeature>

//                     <PlanFeature>PDF report delivery</PlanFeature>

//                     <PlanFeature>24/7 customer support</PlanFeature>
//                   </div>
//                 </CardContent>

//                 <CardFooter>
//                   <Link href={selectHref} className="w-full">
//                     <Button className="h-12 w-full cursor-pointer text-base">
//                       {user ? "Select Package" : "Login to Purchase"}
//                     </Button>
//                   </Link>
//                 </CardFooter>
//               </Card>
//             );
//           })}
//         </div>

//         <div className="mt-10 rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
//           <p className="text-sm leading-7 text-muted-foreground">
//             Bank transfer and online payment options will be available in the
//             next step. For bank transfer, customers will be able to upload
//             payment proof as PDF or image.
//           </p>
//         </div>
//       </section>
//     </main>
//   );
// }

// function PlanFeature({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex gap-3">
//       <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand" />
//       <p className="text-sm leading-6 text-muted-foreground">{children}</p>
//     </div>
//   );
// }

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package, Sparkles } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PaymentPlansPage() {
  const user = await getCurrentUser();

  const backHref = user ? "/dashboard" : "/";
  const backLabel = user ? "Back to Dashboard" : "Back to Home";

  const plans = await prisma.paymentPlan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {/* Back Button */}
        <div className="mb-10">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 border-slate-200 hover:border-brand hover:bg-brand/5",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 gap-2 border-0 bg-gradient-to-r from-brand/20 to-brand/10 text-brand">
            <Sparkles className="h-4 w-4" />
            Payment Plans
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Select a package to request vehicle reports
          </h1>

          <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
            Choose a request package based on how many vehicle reports you need.
            After payment verification, your request balance will be added to
            your account.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const pricePerRequest = Math.round(
              plan.price / plan.requestCredits,
            );

            const isPopular = plan.code === "VALUE_10";

            const selectHref = user ? `/payment-plans/${plan.code}` : "/login";

            return (
              <Card
                key={plan.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border-0 transition-all duration-300",
                  "hover:shadow-2xl hover:shadow-brand/10 hover:-translate-y-1",
                  isPopular
                    ? "bg-gradient-to-b from-white via-white to-brand/5 shadow-xl shadow-brand/20 ring-2 ring-brand"
                    : "bg-white shadow-xl shadow-slate-200/70",
                )}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -right-1 top-6 z-10">
                    <Badge className="rounded-r-none bg-gradient-to-r from-brand to-brand/80 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-brand/30">
                      🔥 Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 text-brand">
                    <Package className="h-7 w-7" />
                  </div>

                  <div className="mt-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.requestCredits} report{" "}
                      {plan.requestCredits > 1 ? "requests" : "request"}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  {/* Price */}
                  <div className="rounded-2xl bg-slate-50/80 p-5 text-center transition-colors group-hover:bg-brand/5 dark:bg-slate-800/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      Package Price
                    </p>

                    <div className="mt-1 flex items-end justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="pb-1 text-sm font-semibold text-muted-foreground">
                        {plan.currency}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Around LKR {pricePerRequest.toLocaleString()} per request
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <PlanFeature>
                      {plan.requestCredits} vehicle report request credits
                    </PlanFeature>
                    <PlanFeature>Dashboard request tracking</PlanFeature>
                    <PlanFeature>PDF report delivery</PlanFeature>
                    <PlanFeature>24/7 customer support</PlanFeature>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Link href={selectHref} className="w-full">
                    <Button
                      className={cn(
                        "h-12 w-full cursor-pointer text-base font-semibold transition-all duration-300",
                        isPopular
                          ? "bg-brand hover:bg-brand/90 shadow-lg shadow-brand/30 hover:shadow-brand/40"
                          : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-300/30 hover:shadow-slate-400/40",
                      )}
                    >
                      {user ? "Select Package" : "Login to Purchase"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 rounded-3xl border border-border/50 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
          <p className="text-sm leading-7 text-muted-foreground">
            Bank transfer and online payment options will be available in the
            next step. For bank transfer, customers will be able to upload
            payment proof as PDF or image.
          </p>
        </div>
      </section>
    </main>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand" />
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

// Utility function for className merging (if you don't have it imported)
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
