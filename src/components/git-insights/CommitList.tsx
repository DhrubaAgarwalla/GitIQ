import type { GithubCommit } from '@/lib/github';
import { CommitItem } from './CommitItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox } from 'lucide-react';

interface CommitListProps {
  commits: GithubCommit[];
  isLoading: boolean;
}

function CommitSkeleton() {
  return (
    <div className="mb-4 p-4 border rounded-lg bg-card">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mt-3" />
      <div className="flex justify-between mt-3">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function CommitList({ commits, isLoading }: CommitListProps) {
  if (isLoading) {
    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <CommitSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-card p-6 rounded-lg shadow">
        <Inbox className="h-16 w-16 mx-auto mb-4 text-primary" />
        <p className="text-xl font-semibold">No commits found.</p>
        <p>This might be an empty repository, or the filters cleared all results.</p>
      </div>
    );
  }

  return (
    <div>
      {commits.map((commit) => (
        <CommitItem key={commit.sha} commit={commit} />
      ))}
    </div>
  );
}
