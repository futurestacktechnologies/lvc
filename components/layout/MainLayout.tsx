import { ReactNode } from "react";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />

      <main>{children}</main>
    </>
  );
}
