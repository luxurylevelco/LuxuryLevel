import Banner from "@/components/banner";

interface PageProps {
  searchParams: Promise<{ query: string | null }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { query } = await searchParams;
  const bannerTitle = `SEARCH RESULTS FOR: ${query}`;
  return (
    <>
      <Banner title={bannerTitle} classnameForBgSrc={""} />
      <div className="section-style"></div>
    </>
  );
}
