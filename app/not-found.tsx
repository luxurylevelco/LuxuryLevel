import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-style flex justify-center items-center flex-col leading-none ">
      <h1 className="text-[100px] font-bold">404</h1>
      <p className="text-[20px] font-semibold">Page not found</p>
      <Link
        href={"/"}
        className="mt-5 text-white bg-default-black p-2 cursor-pointer"
      >
        Go to home
      </Link>
    </div>
  );
}
