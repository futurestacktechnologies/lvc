"use client";

import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";

export default function AdminHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-21 items-center justify-between px-6">
        <div className="py-4">
          <Logo />
          <p className="text-sm font-medium text-muted-foreground">DASHBOARD</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="border-border cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Logout
            </Button>
          </form>

          <Button
            variant="outline"
            size="icon"
            className="border-border lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
