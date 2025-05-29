
'use client';

import type { GithubCommit, GithubUser } from '@/lib/github';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, GitCommit, ExternalLink, PlusCircle, MinusCircle } from 'lucide-react';

interface ContributorListProps {
  commits: GithubCommit[];
}

interface ContributorStat {
  user: GithubUser | { login: string; avatar_url?: string; html_url?: string, name?: string };
  commitCount: number;
  additions: number;
  deletions: number;
}

export function ContributorList({ commits }: ContributorListProps) {
  const contributors = useMemo(() => {
    if (!commits || commits.length === 0) {
      return [];
    }

    const stats: Record<string, ContributorStat> = {};

    commits.forEach(commit => {
      const authorLogin = commit.author?.login || commit.commit.author.name || 'Unknown';
      
      if (!stats[authorLogin]) {
        stats[authorLogin] = {
          user: commit.author || { 
            login: authorLogin, 
            avatar_url: `https://placehold.co/40x40.png`, 
            html_url: `https://github.com/${authorLogin}`, 
            name: commit.commit.author.name 
          },
          commitCount: 0,
          additions: 0,
          deletions: 0,
        };
      }
      stats[authorLogin].commitCount += 1;
      if (commit.stats) {
        stats[authorLogin].additions += commit.stats.additions;
        stats[authorLogin].deletions += commit.stats.deletions;
      }
    });

    return Object.values(stats).sort((a, b) => b.commitCount - a.commitCount);
  }, [commits]);

  if (commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Top Contributors</CardTitle>
          <CardDescription>No contributor data available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Fetch commits to see contributor statistics.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Top Contributors</CardTitle>
        <CardDescription>Contributors by commit count and lines changed for the loaded commits.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] hidden sm:table-cell">Avatar</TableHead>
              <TableHead>Contributor</TableHead>
              <TableHead className="text-right">Commits</TableHead>
              <TableHead className="text-right hidden md:table-cell">Lines Added</TableHead>
              <TableHead className="text-right hidden md:table-cell">Lines Deleted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributors.map(stat => (
              <TableRow key={stat.user.login}>
                <TableCell className="hidden sm:table-cell">
                  <a 
                    href={stat.user.html_url || `https://github.com/${stat.user.login}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    aria-label={`View ${stat.user.name || stat.user.login}'s profile on GitHub`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={stat.user.avatar_url || `https://placehold.co/40x40.png`} alt={stat.user.login} data-ai-hint="profile avatar" />
                      <AvatarFallback>
                        {stat.user.name?.charAt(0)?.toUpperCase() || stat.user.login.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                </TableCell>
                <TableCell>
                   <div className="flex items-center">
                      <a 
                        href={stat.user.html_url || `https://github.com/${stat.user.login}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity sm:hidden mr-2"
                        aria-label={`View ${stat.user.name || stat.user.login}'s profile on GitHub`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stat.user.avatar_url || `https://placehold.co/40x40.png`} alt={stat.user.login} data-ai-hint="profile avatar small" />
                          <AvatarFallback>
                            {stat.user.name?.charAt(0)?.toUpperCase() || stat.user.login.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </a>
                      <a 
                        href={stat.user.html_url || `https://github.com/${stat.user.login}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group inline-flex items-center hover:text-primary transition-colors"
                        aria-label={`View ${stat.user.name || stat.user.login}'s profile on GitHub`}
                      >
                        <div className="font-medium group-hover:underline">{stat.user.name || stat.user.login}</div>
                        {stat.user.name && stat.user.login !== stat.user.name && (
                           <div className="text-xs text-muted-foreground ml-1 group-hover:underline hidden sm:inline">@{stat.user.login}</div>
                        )}
                         <ExternalLink className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </a>
                   </div>
                   <div className="text-xs text-muted-foreground mt-1 md:hidden">
                     {stat.additions > 0 && <span className="inline-flex items-center mr-2"><PlusCircle className="h-3 w-3 mr-0.5 text-green-500" /> {stat.additions.toLocaleString()}</span>}
                     {stat.deletions > 0 && <span className="inline-flex items-center"><MinusCircle className="h-3 w-3 mr-0.5 text-red-500" /> {stat.deletions.toLocaleString()}</span>}
                   </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                     <GitCommit className="h-4 w-4 mr-1.5 text-muted-foreground" />
                     {stat.commitCount.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="flex items-center justify-end text-green-600 dark:text-green-500">
                     <PlusCircle className="h-4 w-4 mr-1.5" />
                     {stat.additions.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="flex items-center justify-end text-red-600 dark:text-red-500">
                     <MinusCircle className="h-4 w-4 mr-1.5" />
                     {stat.deletions.toLocaleString()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
