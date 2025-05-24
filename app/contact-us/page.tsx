import ContactUs from "@/components/homepage/contact-us";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message: string | null }>;
}) {
  const { message } = await searchParams;

  return (
    <>
      <ContactUs message={message} />
    </>
  );
}
