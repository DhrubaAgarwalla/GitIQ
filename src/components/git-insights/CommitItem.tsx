
import type { GithubCommit } from '@/lib/github';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, CalendarDays, Wand2, Loader2, Tags } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useState } from 'react';
import { explainCommitAction, categorizeCommitAction } from '@/lib/server-actions';
import { useToast } from '@/hooks/use-toast';

interface CommitItemProps {
  commit: GithubCommit;
}

export function CommitItem({ commit }: CommitItemProps) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [commitCategories, setCommitCategories] = useState<string[] | null>(null);
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const { toast } = useToast();

  const commitDate = parseISO(commit.commit.author.date);
  const authorName = commit.commit.author.name;
  const authorLogin = commit.author?.login;
  const authorAvatarUrl = commit.author?.avatar_url;
  const commitMessageInitial = commit.commit.message.split('\n')[0];

  const handleFetchAiInsights = async () => {
    if (showAiInsights && (aiExplanation || commitCategories)) {
      setShowAiInsights(false);
      return;
    }

    setShowAiInsights(true);
    if (aiExplanation || commitCategories) return; // Already fetched and displayed once

    setIsAiInsightsLoading(true);
    setAiExplanation(null);
    setCommitCategories(null);

    try {
      const [explanationPromise, categoriesPromise] = await Promise.allSettled([
        explainCommitAction(commit.commit.message),
        categorizeCommitAction(commit.commit.message)
      ]);

      let explanationFailed = true;
      if (explanationPromise.status === 'fulfilled' && explanationPromise.value?.success && explanationPromise.value.data) {
        setAiExplanation(explanationPromise.value.data.explanation);
        explanationFailed = false;
      } else {
        setAiExplanation('Could not generate explanation.');
        console.error('Explain Commit Error:', explanationPromise.status === 'rejected' ? explanationPromise.reason : 'No explanation returned');
      }

      let categoriesFailed = true;
      if (categoriesPromise.status === 'fulfilled' && categoriesPromise.value?.success && categoriesPromise.value.data) {
        setCommitCategories(categoriesPromise.value.data.categories);
        categoriesFailed = false;
      } else {
        setCommitCategories(null);
        console.error('Categorize Commit Error:', categoriesPromise.status === 'rejected' ? categoriesPromise.reason : 'No categories returned');
      }

      if (explanationFailed && categoriesFailed) {
         toast({
            variant: 'destructive',
            title: 'AI Insights Failed',
            description: 'Could not generate explanation or categories for this commit.',
          });
          setShowAiInsights(false); // Hide section on complete failure
      }

    } catch (error) {
      console.error('Fetch AI Insights Error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Insights Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while fetching AI insights.',
      });
      setAiExplanation('Failed to generate explanation.');
      setCommitCategories(null);
      setShowAiInsights(false);
    } finally {
      setIsAiInsightsLoading(false);
    }
  };

  return (
    <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar className="h-12 w-12 border-2 border-primary">
          <AvatarImage src={authorAvatarUrl || `https://placehold.co/48x48.png`} alt={authorName} data-ai-hint="profile avatar" />
          <AvatarFallback>{authorName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-semibold leading-tight break-words">
            {commitMessageInitial.length > 80 ? `${commitMessageInitial.substring(0, 80)}...` : commitMessageInitial}
          </CardTitle>
          <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-x-1.5 gap-y-1">
            <User className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate" title={authorName}>{authorName}</span>
            {authorLogin && <span className="text-xs truncate" title={`@${authorLogin}`}> (@{authorLogin})</span>}
            <span className="mx-1 shrink-0">·</span>
            <CalendarDays className="h-4 w-4 shrink-0" />
            <time dateTime={commit.commit.author.date} className="whitespace-nowrap">
              {formatDistanceToNow(commitDate, { addSuffix: true })}
            </time>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {commit.commit.message.includes('\n') && (
           <details className="text-sm text-muted-foreground mb-3">
            <summary className="cursor-pointer hover:text-primary transition-colors">View full message</summary>
            <pre className="whitespace-pre-wrap bg-secondary p-2 rounded-md mt-1 text-xs font-mono break-words">{commit.commit.message}</pre>
          </details>
        )}

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <Badge variant="outline" className="font-mono text-xs truncate max-w-full">
            SHA: {commit.sha.substring(0, 7)}
          </Badge>
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:text-accent-foreground hover:underline whitespace-nowrap"
            aria-label={`View commit ${commit.sha.substring(0,7)} on GitHub`}
          >
            View on GitHub
            <ExternalLink className="h-4 w-4 ml-1.5 shrink-0" />
          </a>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchAiInsights}
          disabled={isAiInsightsLoading && !aiExplanation && !commitCategories}
          className="w-full sm:w-auto text-sm"
        >
          {isAiInsightsLoading && !aiExplanation && !commitCategories ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {showAiInsights && (aiExplanation || commitCategories) ? 'Hide AI Insights' : 'Get AI Insights'}
        </Button>

        {showAiInsights && (
          <div className="mt-3 p-3 bg-secondary rounded-md space-y-3">
            {isAiInsightsLoading && !aiExplanation && !commitCategories ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating AI insights...</span>
              </div>
            ) : null}

            {aiExplanation && (
              <div>
                <h4 className="text-sm font-semibold mb-1 text-foreground">Explanation:</h4>
                <p className="text-sm text-foreground whitespace-pre-line break-words">{aiExplanation}</p>
              </div>
            )}

            {commitCategories && commitCategories.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1 text-foreground flex items-center">
                  <Tags className="h-4 w-4 mr-1.5" />
                  Suggested Categories:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {commitCategories.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs bg-background hover:bg-muted">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
             {commitCategories && commitCategories.length === 0 && !isAiInsightsLoading && (
                <div>
                     <h4 className="text-sm font-semibold mb-1 text-foreground flex items-center">
                        <Tags className="h-4 w-4 mr-1.5" />
                        Suggested Categories:
                    </h4>
                    <p className="text-xs text-muted-foreground">No specific categories identified by AI.</p>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
