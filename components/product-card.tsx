import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  imgSrc: string;
  hoverImgSrc: string | null;
  productName: string;
  price?: number | string | null;
  salePrice?: number | string | null;
  href: string;
  className?: string;
}

export default function ProductCard({
  imgSrc,
  hoverImgSrc,
  productName,
  price,
  salePrice,
  href,
  className,
}: ProductCardProps) {
  const displayPrice = salePrice || price;

  // --- ETO ANG FIX ---
  // Linisin ang string para makuha lang ang totoong numero. 
  // Hal: "$4,196.18" -> 4196.18 | "AED 0.00" -> 0 | null -> 0
  const numericPrice = Number(String(displayPrice || "").replace(/[^0-9.]/g, ""));
  const numericRegularPrice = Number(String(price || "").replace(/[^0-9.]/g, ""));
  
  // I-display lang kapag ang nalinaw na number ay higit sa 0
  const showPrice = numericPrice > 0;
  
  // Mas safe na discount logic para hindi lumabas kung string na "0" ang salePrice
  const showDiscountBadge = numericPrice > 0 && numericRegularPrice > 0 && salePrice && price;
  // -------------------

  return (
    <Link href={href} className="block ">
      <div
        className={`${className} h-[300px] md:h-[400px] w-full overflow-hidden group transition duration-300 flex flex-col border-transparent relative`}
      >
        {/* Discount Badge */}
        {showDiscountBadge && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            SALE
          </div>
        )}

        {/* Image container */}
        <div className="relative h-2/3 w-full">
          <div className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={productName}
              fill
              sizes="400px"
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
                sizes="400px"
                className="object-contain transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              />
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="h-1/3 flex flex-col justify-center items-center px-2">
          <p className="text-sm 2xl:text-base text-black w-full leading-tight text-center">
            {productName}
          </p>

          {/* Dito natin papalitan yung 'displayPrice &&' gamit ang bagong 'showPrice' */}
          {showPrice && (
            <div className="flex items-center gap-2 pt-2">
              <p className="font-semibold text-sm text-gray-900">
                {typeof displayPrice === 'number' 
                  ? `AED ${displayPrice.toLocaleString('en-US')}` 
                  : displayPrice}
              </p>
              
              {showDiscountBadge && price && (
                <p className="text-xs text-gray-400 line-through">
                  {typeof price === 'number' ? `AED ${price.toLocaleString()}` : price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}