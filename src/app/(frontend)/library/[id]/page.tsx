import { LibraryContent } from "@/components/library-content";
import { use } from "react";

interface PageParams {
  id: string;
}

export default function LibraryPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);

  return <LibraryContent libraryId={id} />;
}
