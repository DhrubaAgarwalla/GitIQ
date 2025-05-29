
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface SummaryCardProps {
  summaryText: string | null;
  isLoading: boolean;
}

export function SummaryCard({ summaryText, isLoading }: SummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          <CardTitle className="text-xl">Frequent Changes Summary</CardTitle>
        </div>
        <CardDescription>AI-powered insights into your commit history.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : summaryText ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{summaryText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No summary available. Fetch commits to generate insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
