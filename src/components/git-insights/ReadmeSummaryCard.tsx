
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

interface ReadmeSummaryCardProps {
  readmeFilename: string | null;
  summaryText: string | null;
  isLoading: boolean;
}

export function ReadmeSummaryCard({ readmeFilename, summaryText, isLoading }: ReadmeSummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center">
          <FileText className="h-6 w-6 mr-2 text-primary" />
          <CardTitle className="text-xl">README Summary</CardTitle>
        </div>
        <CardDescription>
          {isLoading 
            ? "AI is generating a summary of the README..." 
            : readmeFilename 
            ? `AI-powered summary of ${readmeFilename}`
            : "AI-powered summary of the repository's README."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : summaryText ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{summaryText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {readmeFilename === null && !isLoading // Only show this if we tried and found no README or error
             ? "No README found or it could not be processed."
             : "No summary available. Fetch repository data to generate insights."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
