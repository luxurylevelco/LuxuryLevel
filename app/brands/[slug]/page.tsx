import Banner from "@/components/banner";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string | null }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <>
      <Banner title={slug.toUpperCase()} classnameForBgSrc={""} />
      <div className="section-style"></div>
    </>
  );
}
