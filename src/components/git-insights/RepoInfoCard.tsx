
'use client';

import type { GithubRepoDetails } from '@/lib/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star, GitFork, Code2, CircleDot, BookText, Scale, ExternalLink, Package, CalendarClock, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface RepoInfoCardProps {
  repoDetails: GithubRepoDetails | null;
  isLoading: boolean;
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; className?: string }> = ({ icon: Icon, label, value, className }) => (
  <div className={`flex items-center text-sm ${className}`}>
    <Icon className="h-4 w-4 mr-2 shrink-0 text-primary" />
    <span className="font-medium mr-1">{label}:</span>
    <span className="text-muted-foreground truncate">{value}</span>
  </div>
);

function formatRepoSize(sizeInKB: number): string {
  if (sizeInKB < 1024) {
    return `${sizeInKB.toLocaleString()} KB`;
  }
  const sizeInMB = sizeInKB / 1024;
  if (sizeInMB < 1024) {
    return `${parseFloat(sizeInMB.toFixed(1)).toLocaleString()} MB`;
  }
  const sizeInGB = sizeInMB / 1024;
  return `${parseFloat(sizeInGB.toFixed(2)).toLocaleString()} GB`;
}


export function RepoInfoCard({ repoDetails, isLoading }: RepoInfoCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
           <div className="space-y-1 pt-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="pt-2">
            <Skeleton className="h-5 w-1/4 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!repoDetails) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl">Repository Information</CardTitle>
          <CardDescription>Details about the GitHub repository.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No repository details available. Fetch a repository to see its information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={repoDetails.owner.avatar_url} alt={repoDetails.owner.login} data-ai-hint="organization logo" />
            <AvatarFallback>{repoDetails.owner.login.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <a href={repoDetails.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <CardTitle className="text-xl font-semibold text-primary hover:text-primary/90 flex items-center">
                {repoDetails.full_name}
                <ExternalLink className="h-4 w-4 ml-2" />
              </CardTitle>
            </a>
            <CardDescription className="mt-1">
              Owned by <a href={repoDetails.owner.html_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">{repoDetails.owner.login}</a>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {repoDetails.description && (
          <div className="flex items-start text-sm">
            <BookText className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary" />
            <p className="text-muted-foreground break-words">{repoDetails.description}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <StatItem icon={Star} label="Stars" value={repoDetails.stargazers_count.toLocaleString()} />
          <StatItem icon={GitFork} label="Forks" value={repoDetails.forks_count.toLocaleString()} />
          <StatItem icon={CircleDot} label="Open Issues" value={repoDetails.open_issues_count.toLocaleString()} />
           {repoDetails.size !== undefined && (
            <StatItem icon={Package} label="Size" value={formatRepoSize(repoDetails.size)} />
          )}
          {repoDetails.language && (
            <StatItem icon={Code2} label="Language" value={<Badge variant="secondary">{repoDetails.language}</Badge>} />
          )}
          {repoDetails.license && (
            <StatItem 
              icon={Scale} 
              label="License" 
              value={repoDetails.license.name} 
            />
          )}
        </div>

        {repoDetails.topics && repoDetails.topics.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center text-sm mb-1.5">
                <Tag className="h-4 w-4 mr-2 shrink-0 text-primary" />
                <span className="font-medium">Topics:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {repoDetails.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="font-normal">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

         <div className="text-xs text-muted-foreground pt-2 space-y-1">
            <p title={new Date(repoDetails.created_at).toLocaleString()}>
              <CalendarClock className="inline h-3.5 w-3.5 mr-1 relative -top-px" />
              Created: {formatDistanceToNow(parseISO(repoDetails.created_at), { addSuffix: true })}
            </p>
            <p title={new Date(repoDetails.pushed_at).toLocaleString()}>
               <CalendarClock className="inline h-3.5 w-3.5 mr-1 relative -top-px" />
              Last push: {formatDistanceToNow(parseISO(repoDetails.pushed_at), { addSuffix: true })}
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
