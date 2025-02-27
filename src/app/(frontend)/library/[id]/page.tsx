import { LibraryContent } from "@/components/library-content";

interface LibraryPageProps {
  params: {
    id: string;
  };
}

export default function LibraryPage({ params }: LibraryPageProps) {
  return <LibraryContent libraryId={params.id} />;
}
