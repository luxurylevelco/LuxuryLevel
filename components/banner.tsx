interface BannerProps {
  title: string;
  classnameForBgSrc: string;
}

export default function Banner({ title, classnameForBgSrc }: BannerProps) {
  return (
    <div
      className={`h-[200px] mt-[50px] w-full bg-gray-300 flex justify-center items-center ${classnameForBgSrc} text-white text-[50px] font-bold`}
    >
      {title}
    </div>
  );
}
