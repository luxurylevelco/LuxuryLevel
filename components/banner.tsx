interface BannerProps {
  title: string;
  classnameForBgSrc: string;
}

export default function Banner({ title, classnameForBgSrc }: BannerProps) {
  return (
    <div
      className={`h-[200px] mt-[50px] w-full bg-gray-300 drop-shadow-2xl flex justify-center items-center ${classnameForBgSrc} text-white text-[40px] font-bold`}
    >
      <span className="relative z-10 [text-shadow:_2px_2px_4px_rgba(0,0,0,0.7)]">
        {title}
      </span>
    </div>
  );
}
