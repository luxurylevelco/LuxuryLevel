"use client";

import { PageInfo } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment } from "react";
import Image from "next/image";

export default function Pagination({ pageInfo }: { pageInfo: PageInfo }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPageNo = pageInfo.current;
  const totalPageNo = pageInfo.total;

  const getPagesArrNo = (): string[] => {
    const pages = new Set<number>();

    pages.add(1);

    for (let i = currentPageNo - 1; i <= currentPageNo + 1; i++) {
      if (i > 1 && i < totalPageNo) {
        pages.add(i);
      }
    }

    if (totalPageNo > 1) {
      pages.add(totalPageNo);
    }

    return Array.from(pages)
      .sort((a, b) => a - b)
      .map(String);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const pageNumbers = getPagesArrNo();

  return (
    <div className="flex w-full justify-center items-center gap-2">
      {/* Previous */}
      <button
        onClick={() => handlePageChange(currentPageNo - 1)}
        disabled={currentPageNo <= 1}
        className={`link-box p-3 border text-sm ${
          currentPageNo <= 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <Image
          src="/svgs/arrow-down.svg"
          alt="Previous"
          width={100}
          height={100}
          className="rotate-90"
        />
      </button>

      {/* Page numbers */}
      {pageNumbers.map((pageNo, idx) => {
        const prevPage = pageNumbers[idx - 1];
        const shouldInsertEllipsis =
          idx > 0 && Number(pageNo) - Number(prevPage) > 1;

        return (
          <Fragment key={pageNo}>
            {shouldInsertEllipsis && <span className="px-2">...</span>}

            <button
              onClick={() => handlePageChange(Number(pageNo))}
              className={`flex justify-center items-center border text-sm link-box px-3 py-1.5 ${
                Number(pageNo) === currentPageNo
                  ? "bg-black text-white"
                  : "bg-white"
              }`}
            >
              {pageNo}
            </button>
          </Fragment>
        );
      })}

      {/* Next */}
      <button
        onClick={() => handlePageChange(currentPageNo + 1)}
        disabled={currentPageNo >= totalPageNo}
        className={`link-box p-3 border text-sm ${
          currentPageNo >= totalPageNo ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <Image
          src="/svgs/arrow-down.svg"
          alt="Next"
          width={100}
          height={100}
          className="-rotate-90"
        />
      </button>
    </div>
  );
}
