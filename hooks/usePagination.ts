import { useState } from "react";
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_SIZE } from "@/lib/constants";

export function usePagination(initialPage = PAGINATION_DEFAULT_PAGE, initialSize = PAGINATION_DEFAULT_SIZE) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);

  function nextPage() {
    setPage((p) => p + 1);
  }

  function prevPage() {
    setPage((p) => Math.max(0, p - 1));
  }

  function reset() {
    setPage(initialPage);
    setSize(initialSize);
  }

  return { page, size, setPage, setSize, nextPage, prevPage, reset };
}
