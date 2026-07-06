import Hero from "@/features/home/sections/Hero";
import RequestCard from "@/features/home/components/RequestCard";
import Container from "@/components/layout/Container";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Request Report Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20">
        <Container>
          <div className="mx-auto max-w-2xl">
            <RequestCard />
          </div>
        </Container>
      </section>

      {/* You can add more sections (How it works, Pricing, FAQ, etc.) here */}
    </>
  );
}
