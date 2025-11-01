import { createFileRoute } from '@tanstack/react-router';
import { KnowledgeLibraryPage } from '@/pages/user/knowledge-library';

export const Route = createFileRoute('/_authenticated/knowledge-library')({
  component: KnowledgeLibraryPage,
});
