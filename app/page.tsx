import About from "@/components/homepage/about-us";
import Hero from "@/components/homepage/hero";
import Maps from "@/components/homepage/maps";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Maps />
    </>
  );
}
