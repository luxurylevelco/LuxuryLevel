import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  imgSrc: string;
  hoverImgSrc: string | null;
  productName: string;
  price: string | null;
  href: string;
  className?: string;
}

export default function ProductCard({
  imgSrc,
  hoverImgSrc,
  productName,
  price,
  href,
  className,
}: ProductCardProps) {
  return (
    <Link href={href} className="block">
      <div
        className={`${className} h-[400px] w-full overflow-hidden group transition duration-300 flex flex-col p-4 border-transparent `}
      >
        {/* Image container */}
        <div className="relative h-2/3 w-full">
          {/* Stacked images */}
          <div className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={productName}
              fill
              className={`object-cover transition-opacity duration-300 ${
                !!hoverImgSrc ? "group-hover:opacity-0" : ""
              }`}
            />
          </div>
          {hoverImgSrc && (
            <div className="absolute inset-0">
              <Image
                src={hoverImgSrc}
                alt={`${productName} (Hover)`}
                fill
                className="object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              />
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="h-1/3 flex flex-col justify-start items-center text-center  p-4">
          <p className="text-sm lg:text-base text-black w-full">
            {productName}
          </p>

          {price !== null && (
            <p className="text-green-700 font-semibold text-md pt-2">{price}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
