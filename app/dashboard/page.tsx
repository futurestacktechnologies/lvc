import { redirect } from "next/navigation";
import { FileText, Package, Phone, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [activePackages, recentRequests, totalRequests] = await Promise.all([
    prisma.userPackage.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.reportRequest.findMany({
      where: {
        customerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.reportRequest.count({
      where: {
        customerId: user.id,
      },
    }),
  ]);

  const totalRemainingRequests = activePackages.reduce(
    (total, userPackage) => total + userPackage.remainingRequests,
    0,
  );

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
          </div>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            Back to Home
          </Link>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Account Status
              </CardTitle>
              <UserRound className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.status}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Phone verified account
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Remaining Requests
              </CardTitle>
              <Package className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRemainingRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Available from active packages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileText className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Reports requested so far
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{user.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand" />
                  <p className="font-semibold text-foreground">{user.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className="mt-1">{user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Payment Packages</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="font-semibold text-foreground">
                    No active package yet
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a payment plan to start requesting vehicle reports.
                  </p>

                  <Button className="mt-5">View Payment Plans</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePackages.map((userPackage) => (
                    <div
                      key={userPackage.id}
                      className="rounded-2xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {userPackage.plan.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Package No: {userPackage.packageNumber}
                          </p>
                        </div>

                        <Badge>{userPackage.status}</Badge>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold">
                            {userPackage.totalRequests}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="font-semibold">
                            {userPackage.usedRequests}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Remaining
                          </p>
                          <p className="font-semibold">
                            {userPackage.remainingRequests}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Report Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="font-semibold text-foreground">
                  No report requests yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your vehicle report requests will appear here.
                </p>

                <Button className="mt-5">Request Report</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {request.vehicleIdentifier}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Request No: {request.requestNumber}
                      </p>
                    </div>

                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
