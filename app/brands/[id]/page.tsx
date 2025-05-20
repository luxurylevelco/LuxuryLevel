import Banner from "@/components/banner";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string | null }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <>
      <Banner title={id} classnameForBgSrc={""} />
      <div className="section-style"></div>
    </>
  );
}
