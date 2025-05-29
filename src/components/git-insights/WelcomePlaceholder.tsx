
'use client';

import { BarChart2, Users, Lightbulb, FileText } from 'lucide-react';

export function WelcomePlaceholder() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center bg-card p-6 sm:p-8 rounded-lg shadow-lg">

      <h2 className="text-2xl sm:text-3xl font-semibold text-primary mb-3">Welcome to GitIQ!</h2>
      <p className="text-md sm:text-lg text-muted-foreground mb-8 max-w-xl">
        Enter a GitHub repository URL above to explore its commit history, analyze contributor activity, and gain AI-powered insights into its development.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl text-sm">
        <div className="flex flex-col items-center p-3 bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
          <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-accent mb-2" />
          <p className="text-foreground">AI Summaries</p>
        </div>
        <div className="flex flex-col items-center p-3 bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
          <BarChart2 className="h-7 w-7 sm:h-8 sm:w-8 text-accent mb-2" />
          <p className="text-foreground">Activity Charts</p>
        </div>
        <div className="flex flex-col items-center p-3 bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
          <Users className="h-7 w-7 sm:h-8 sm:w-8 text-accent mb-2" />
          <p className="text-foreground">Contributor Stats</p>
        </div>
        <div className="flex flex-col items-center p-3 bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
          <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-accent mb-2" />
          <p className="text-foreground">README Insights</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Let&apos;s get started! Paste a repository URL into the form above to begin.
      </p>
    </div>
  );
}
