
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GithubCommit, GithubRepoDetails } from '@/lib/github';
import { fetchCommits, fetchRepoDetails, getRepoTotalCommitsViaLinkHeader, fetchReadmeInfo } from '@/lib/github';
import { summarizeCommitsAction, summarizeReadmeAction, categorizeAllCommitsAction } from '@/lib/server-actions';
import { Header } from '@/components/git-insights/Header';
import { RepoForm } from '@/components/git-insights/RepoForm';
import { CommitList } from '@/components/git-insights/CommitList';
import { Filters } from '@/components/git-insights/Filters';
import { SummaryCard } from '@/components/git-insights/SummaryCard';
import { ReadmeSummaryCard } from '@/components/git-insights/ReadmeSummaryCard';
import { RepoInfoCard } from '@/components/git-insights/RepoInfoCard';
import { CommitActivityChart } from '@/components/git-insights/CommitActivityChart';
import { ContributorList } from '@/components/git-insights/ContributorList';
import { WelcomePlaceholder } from '@/components/git-insights/WelcomePlaceholder';
import { CommitCategoriesChart } from '@/components/git-insights/CommitCategoriesChart';
import { CategoryFilter } from '@/components/git-insights/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Loader2, Tags, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseISO, compareAsc, compareDesc } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import type { CommitCategory } from '@/types/commit-categories';

export default function GitInsightsPage() {
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [filteredCommits, setFilteredCommits] = useState<GithubCommit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [repoDetails, setRepoDetails] = useState<GithubRepoDetails | null>(null);
  const [isLoadingRepoDetails, setIsLoadingRepoDetails] = useState(false);
  const [totalRepoCommits, setTotalRepoCommits] = useState<number | null>(null);

  const [readmeFilename, setReadmeFilename] = useState<string | null>(null);
  const [readmeSummary, setReadmeSummary] = useState<string | null>(null);
  const [isReadmeSummaryLoading, setIsReadmeSummaryLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<{username: string, repository: string} | null>(null);

  // Categorization state
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizedCommitsCount, setCategorizedCommitsCount] = useState(0);
  const [categorizationProgress, setCategorizationProgress] = useState('');

  const { toast } = useToast();
  const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  useEffect(() => {
    if (githubToken) {
      console.log('GitHub token found and loaded by the application.');
    } else {
      console.warn('GitHub token NOT found. The application will make unauthenticated API requests, which have lower rate limits.');
    }
  }, [githubToken]);

  const initialFilterState = { author: '', message: '', dateRange: undefined as DateRange | undefined };
  const initialCategoryFilter = [] as CommitCategory[];
  const initialSortState = { by: 'date' as 'date' | 'author', order: 'desc' as 'asc' | 'desc' };

  const [currentFilters, setCurrentFilters] = useState(initialFilterState);
  const [currentSort, setCurrentSort] = useState(initialSortState);
  const [selectedCategories, setSelectedCategories] = useState(initialCategoryFilter);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(commits.map(commit => commit.commit.author.name).filter(Boolean));
    return Array.from(authors).sort();
  }, [commits]);

  const availableCategories = useMemo(() => {
    const categories = new Set<CommitCategory>();
    commits.forEach(commit => {
      if (commit.categories) {
        commit.categories.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories).sort();
  }, [commits]);

  const handleFetchCommits = async (username: string, repository: string) => {
    setIsLoadingCommits(true);
    setIsLoadingRepoDetails(true);
    setIsSummaryLoading(true); // Start loading for commit summary
    setIsReadmeSummaryLoading(true); // Start loading for README summary
    setAiSummary(null);
    setReadmeSummary(null);
    setReadmeFilename(null);
    setCommits([]);
    setFilteredCommits([]);
    setRepoDetails(null);
    setTotalRepoCommits(null);
    setCurrentFilters(initialFilterState);
    setCurrentSort(initialSortState);
    setSelectedCategories(initialCategoryFilter);
    setCurrentPage(1);
    setHasNextPage(false);
    setCurrentRepo(null);

    try {
      // Fetch repo details and total commit count in parallel
      const [detailsResult, totalCountResultLinkHeader, readmeInfoResult] = await Promise.allSettled([
        fetchRepoDetails(username, repository, githubToken),
        getRepoTotalCommitsViaLinkHeader(username, repository, githubToken),
        fetchReadmeInfo(username, repository, githubToken)
      ]);

      if (detailsResult.status === 'fulfilled') {
        setRepoDetails(detailsResult.value);
      } else {
        console.error('Fetch Repo Details Error:', detailsResult.reason);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Repository Details',
          description: detailsResult.reason instanceof Error ? detailsResult.reason.message : 'An unknown error occurred.',
        });
        setRepoDetails(null);
      }
      setIsLoadingRepoDetails(false);

      if (totalCountResultLinkHeader.status === 'fulfilled') {
        const countOrError = totalCountResultLinkHeader.value;
        if (typeof countOrError === 'number') {
          setTotalRepoCommits(countOrError);
        } else {
          console.warn('Fetch Total Commit Count (Link Header Method) Info:', countOrError);
           toast({
            variant: 'default',
            title: 'Total Commit Count',
            description: `Could not determine total commits via Link header: ${countOrError.replace('Error: ','').replace('Info: ','')}. Displaying loaded commits count.`,
            duration: 7000,
          });
          setTotalRepoCommits(null);
        }
      } else {
        console.warn('Fetch Total Commit Count (Link Header Method) Promise Rejected:', totalCountResultLinkHeader.reason);
        setTotalRepoCommits(null);
      }

      // Handle README processing
      if (readmeInfoResult.status === 'fulfilled' && readmeInfoResult.value) {
        const { name: fetchedReadmeName, content: readmeContent } = readmeInfoResult.value;
        setReadmeFilename(fetchedReadmeName);
        if (readmeContent) {
          try {
            const readmeSummaryResult = await summarizeReadmeAction(readmeContent);
            if (readmeSummaryResult.success && readmeSummaryResult.data) {
              setReadmeSummary(readmeSummaryResult.data.summary);
            } else {
              throw new Error(readmeSummaryResult.error);
            }
          } catch (aiError) {
            console.error('AI README Summary Error:', aiError);
            toast({
              variant: 'destructive',
              title: 'AI README Summary Failed',
              description: aiError instanceof Error ? aiError.message : 'Could not generate README summary.',
            });
            setReadmeSummary('Failed to generate README summary.');
          }
        } else {
          setReadmeSummary('README content was empty or too short to summarize.');
        }
      } else if (readmeInfoResult.status === 'rejected') {
        console.error('Fetch README Info Error:', readmeInfoResult.reason);
        setReadmeSummary('Could not fetch README information.');
      } else {
         // No README found or null returned
        setReadmeFilename(null); // Explicitly set to null if no README found
        setReadmeSummary(null); // No summary if no README
      }
      setIsReadmeSummaryLoading(false);


      // Fetch commits (first page)
      const { commits: fetchedCommits, hasNextPage: newHasNextPage } = await fetchCommits(username, repository, 1, githubToken);
      setCommits(fetchedCommits);
      setHasNextPage(newHasNextPage);
      setCurrentRepo({ username, repository });

      if (fetchedCommits.length > 0) {
        toast({ title: 'Success', description: `Fetched ${fetchedCommits.length} commits.` });
        // AI Summary for commits
        try {
          const commitMessages = fetchedCommits.map(commit => commit.commit.message);
          const summaryResult = await summarizeCommitsAction(commitMessages);
          if (summaryResult.success && summaryResult.data) {
            setAiSummary(summaryResult.data.summary);
          } else {
            throw new Error(summaryResult.error);
          }
        } catch (aiError) {
          console.error('AI Commit Summary Error:', aiError);
          toast({
            variant: 'destructive',
            title: 'AI Commit Summary Failed',
            description: aiError instanceof Error ? aiError.message : 'Could not generate commit summary.',
          });
          setAiSummary('Failed to generate commit summary.');
        }
      } else {
         toast({ title: 'No Commits', description: 'No commits found for this repository.' });
         setAiSummary('No commits to summarize.'); // Set appropriate message if no commits
      }
    } catch (error) {
      console.error('Fetch Data Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Repository Data',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      setCommits([]);
      setHasNextPage(false);
      setCurrentRepo(null);
      setAiSummary(null);
      setReadmeSummary(null);
    } finally {
      setIsLoadingCommits(false);
      setIsSummaryLoading(false);
      setIsReadmeSummaryLoading(false);
    }
  };

  const handleLoadMoreCommits = async () => {
    if (!hasNextPage || isLoadingCommits || !currentRepo) return;

    setIsLoadingCommits(true);
    const nextPageToFetch = currentPage + 1;
    try {
      const { commits: newCommits, hasNextPage: newHasNextPage } = await fetchCommits(currentRepo.username, currentRepo.repository, nextPageToFetch, githubToken);
      setCommits(prevCommits => [...prevCommits, ...newCommits]);
      setCurrentPage(nextPageToFetch);
      setHasNextPage(newHasNextPage);
      toast({ title: 'More Commits Loaded', description: `Loaded ${newCommits.length} additional commits.` });
    } catch (error) {
      console.error('Load More Commits Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error Loading More Commits',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      setHasNextPage(false); // Stop trying to load more if an error occurs
    } finally {
      setIsLoadingCommits(false);
    }
  };

  const handleCategorizeAllCommits = async () => {
    if (commits.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Commits',
        description: 'No commits available to categorize.',
      });
      return;
    }

    setIsCategorizing(true);
    setCategorizationProgress(`Preparing to categorize ${commits.length} commits...`);

    try {
      const commitsToCategories = commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message
      }));

      setCategorizationProgress(`Processing ${commits.length} commits in batches...`);
      const result = await categorizeAllCommitsAction(commitsToCategories);

      if (result.success && result.data) {
        setCategorizationProgress('Updating commit data...');

        // Update commits with categories
        const updatedCommits = commits.map(commit => {
          const categorizedCommit = result.data.categorizedCommits.find(
            c => c.sha === commit.sha
          );
          return categorizedCommit
            ? { ...commit, categories: categorizedCommit.categories as CommitCategory[] }
            : commit;
        });

        setCommits(updatedCommits);
        setCategorizedCommitsCount(result.data.categorizedCommits.length);

        const successRate = ((result.data.categorizedCommits.length / commits.length) * 100).toFixed(1);
        const stats = result.data.stats;

        toast({
          title: 'Smart Categorization Complete',
          description: `Successfully categorized ${result.data.categorizedCommits.length}/${commits.length} commits (${successRate}%). Keywords: ${stats?.keywordBased || 0}, AI: ${stats?.aiBased || 0}, Fallback: ${stats?.fallback || 0}`,
        });
      } else {
        throw new Error(result.error || 'Failed to categorize commits');
      }
    } catch (error) {
      console.error('Categorization Error:', error);
      toast({
        variant: 'destructive',
        title: 'Categorization Failed',
        description: error instanceof Error ? error.message : 'Could not categorize commits.',
      });
    } finally {
      setIsCategorizing(false);
      setCategorizationProgress('');
    }
  };

  const applyFiltersAndSorting = useCallback(() => {
    let tempCommits = [...commits];

    if (currentFilters.author) {
      tempCommits = tempCommits.filter(
        (commit) => commit.commit.author.name === currentFilters.author
      );
    }
    if (currentFilters.message) {
      tempCommits = tempCommits.filter((commit) =>
        commit.commit.message.toLowerCase().includes(currentFilters.message.toLowerCase())
      );
    }
    if (currentFilters.dateRange?.from) {
      tempCommits = tempCommits.filter((commit) => {
        const commitDate = parseISO(commit.commit.author.date);
        if (!currentFilters.dateRange?.from) return true;
        let inRange = commitDate >= currentFilters.dateRange.from;
        if (currentFilters.dateRange.to) {
          const endDate = new Date(currentFilters.dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          inRange = inRange && commitDate <= endDate;
        }
        return inRange;
      });
    }
    if (selectedCategories && selectedCategories.length > 0) {
      tempCommits = tempCommits.filter((commit) => {
        if (!commit.categories || commit.categories.length === 0) return false;
        return selectedCategories.some(filterCategory =>
          commit.categories!.includes(filterCategory)
        );
      });
    }

    if (currentSort.by === 'date') {
      tempCommits.sort((a, b) => {
        const dateA = parseISO(a.commit.author.date);
        const dateB = parseISO(b.commit.author.date);
        return currentSort.order === 'asc' ? compareAsc(dateA, dateB) : compareDesc(dateA, dateB);
      });
    } else if (currentSort.by === 'author') {
      tempCommits.sort((a, b) => {
        const authorA = a.commit.author.name.toLowerCase();
        const authorB = b.commit.author.name.toLowerCase();
        return currentSort.order === 'asc'
          ? authorA.localeCompare(authorB)
          : authorB.localeCompare(authorA);
      });
    }
    setFilteredCommits(tempCommits);
  }, [commits, currentFilters, currentSort, selectedCategories]);


  useEffect(() => {
    applyFiltersAndSorting();
  }, [applyFiltersAndSorting]);


  const handleFilterChange = (newFilters: Partial<typeof currentFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSort: Partial<typeof currentSort>) => {
    setCurrentSort(prev => ({ ...prev, ...newSort }));
  };

  const handleResetFilters = () => {
    setCurrentFilters(initialFilterState);
    setCurrentSort(initialSortState);
    setSelectedCategories(initialCategoryFilter);
  };

  const commitCountText = useMemo(() => {
    if (commits.length === 0 && !isLoadingCommits) return null;
    if (isLoadingCommits && currentPage === 1) return <div className="mb-4 text-sm text-muted-foreground">Loading commit data...</div>;

    let text = '';
    if (totalRepoCommits !== null) {
      text = `Showing ${filteredCommits.length} of ${totalRepoCommits.toLocaleString()} total commit${totalRepoCommits === 1 ? '' : 's'}. (${commits.length} loaded)`;
    } else {
      text = `Showing ${filteredCommits.length} of ${commits.length} loaded commit${commits.length === 1 ? '' : 's'}.`;
    }
    return text;
  }, [commits.length, filteredCommits.length, totalRepoCommits, isLoadingCommits, currentPage]);


  const LoadMoreCommitsButton = ({className = ""}: {className?: string}) => (
    <>
      {hasNextPage && !isLoadingCommits && (
        <Button
          onClick={handleLoadMoreCommits}
          className={`w-full ${className}`}
          variant="default"
        >
          Load More Commits
        </Button>
      )}
      {isLoadingCommits && currentPage > 0 && commits.length > 0 && (
          <Button
          disabled
          className={`w-full ${className}`}
          variant="outline"
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading more...
        </Button>
      )}
    </>
  );


  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-4 md:p-8">
        <Header />
        <RepoForm onFetchCommits={handleFetchCommits} isLoading={isLoadingCommits || isLoadingRepoDetails || isSummaryLoading || isReadmeSummaryLoading} />

        {(commits.length > 0 || isLoadingCommits || repoDetails || isLoadingRepoDetails || currentRepo) ? (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 space-y-6">
              <RepoInfoCard repoDetails={repoDetails} isLoading={isLoadingRepoDetails} />
              <SummaryCard summaryText={aiSummary} isLoading={isSummaryLoading} />
              <ReadmeSummaryCard readmeFilename={readmeFilename} summaryText={readmeSummary} isLoading={isReadmeSummaryLoading} />
              {commits.length > 0 && (
                <Filters
                  authors={uniqueAuthors}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  currentFilters={currentFilters}
                  currentSort={currentSort}
                  onResetFilters={handleResetFilters}
                />
              )}
            </aside>
            <section className="lg:col-span-8">
              <Tabs defaultValue="history" className="w-full">
                <div className="flex flex-col gap-4 mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history">Commit History</TabsTrigger>
                    <TabsTrigger value="dashboard">Activity Dashboard</TabsTrigger>
                  </TabsList>

                  {/* Category Filter - Show prominently when categories are available */}
                  {availableCategories.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Tags className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Filter by Category:</span>
                      </div>
                      <div className="flex-1">
                        <CategoryFilter
                          selectedCategories={selectedCategories}
                          onCategoriesChange={setSelectedCategories}
                          availableCategories={availableCategories}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <TabsContent value="history">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    {commitCountText && (
                      <div className="text-sm text-muted-foreground">
                        {commitCountText}
                        {currentRepo && !hasNextPage && commits.length > 0 && (
                          <span className="ml-1"> (All currently reachable commits loaded for this repository)</span>
                        )}
                      </div>
                    )}
                    {commits.length > 0 && (
                      <Button
                        onClick={handleCategorizeAllCommits}
                        disabled={isCategorizing}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isCategorizing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isCategorizing ? (categorizationProgress || 'Categorizing...') : 'Categorize All Commits'}
                      </Button>
                    )}
                  </div>
                  <CommitList commits={filteredCommits} isLoading={isLoadingCommits && currentPage === 1 && commits.length === 0} />
                  <div className="mt-6">
                    <LoadMoreCommitsButton />
                  </div>
                </TabsContent>
                <TabsContent value="dashboard">
                  {isLoadingCommits && commits.length === 0 ? (
                     <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     </div>
                  ) : commits.length > 0 ? (
                    <div className="space-y-6">
                       {hasNextPage && (
                        <Alert variant="default" className="bg-accent/10 border-accent/30">
                          <Info className="h-5 w-5 text-accent" />
                          <AlertTitle className="text-accent">More Data Available</AlertTitle>
                          <AlertDescription className="text-accent/80">
                            The data on this dashboard is based on the {commits.length.toLocaleString()} currently loaded commit{commits.length === 1 ? '' : 's'}. For a more complete picture, use the button below or in the &apos;Commit History&apos; tab to load more.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <LoadMoreCommitsButton className="sm:w-auto" />
                        {commits.length > 0 && (
                          <Button
                            onClick={handleCategorizeAllCommits}
                            disabled={isCategorizing}
                            variant="outline"
                            className="flex items-center gap-2 sm:w-auto"
                          >
                            {isCategorizing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Tags className="h-4 w-4" />
                            )}
                            {isCategorizing ? (categorizationProgress || 'Categorizing...') : 'Categorize Commits'}
                          </Button>
                        )}
                      </div>
                      <CommitCategoriesChart commits={commits} />
                      <CommitActivityChart commits={commits} />
                      <ContributorList commits={commits} />
                    </div>
                  ) : (
                     <div className="text-center py-10 text-muted-foreground bg-card p-6 rounded-lg shadow">
                        <p className="text-xl font-semibold">No data for dashboard.</p>
                        <p>Fetch commits to see activity and contributor insights.</p>
                     </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </div>
        ) : (
          <WelcomePlaceholder />
        )}
      </main>
      <footer className="text-center py-8 text-muted-foreground text-sm border-t border-border mt-12">
        <p>Powered by Groq AI & Next.js</p>
        <p>Created by Dhruba Kr. Agarwalla (2411100)</p>
      </footer>
    </div>
  );
}
