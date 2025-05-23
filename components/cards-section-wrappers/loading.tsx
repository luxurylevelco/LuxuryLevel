import Spinner from "@/components/spinner";

export default function CardsSectionLoading() {
  return (
    <div className="w-full flex justify-center items-center min-h-screen padding bg-white gap-4  ">
      <Spinner />
    </div>
  );
}
