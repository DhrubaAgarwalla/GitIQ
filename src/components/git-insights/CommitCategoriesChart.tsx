'use client';

import type { GithubCommit } from '@/lib/github';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tags } from 'lucide-react';
import { calculateCategoryStats, getCategoryColor, getCategoryIcon, type CommitCategoryStats } from '@/types/commit-categories';

interface CommitCategoriesChartProps {
  commits: GithubCommit[];
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  icon: string;
  percentage: number;
}

export function CommitCategoriesChart({ commits }: CommitCategoriesChartProps) {
  const { chartData, totalCategorizedCommits, categoryStats } = useMemo(() => {
    // Filter commits that have categories
    const categorizedCommits = commits.filter(commit => commit.categories && commit.categories.length > 0);

    if (categorizedCommits.length === 0) {
      return { chartData: [], totalCategorizedCommits: 0, categoryStats: [] };
    }

    // Convert to the format expected by calculateCategoryStats
    const commitsForStats = categorizedCommits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      categories: commit.categories || []
    }));

    const stats = calculateCategoryStats(commitsForStats);

    const data: ChartDataPoint[] = stats.map(stat => ({
      name: stat.category,
      value: stat.count,
      color: stat.color,
      icon: getCategoryIcon(stat.category),
      percentage: stat.percentage
    }));

    return {
      chartData: data,
      totalCategorizedCommits: categorizedCommits.length,
      categoryStats: stats
    };
  }, [commits]);

  if (totalCategorizedCommits === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tags className="h-5 w-5 mr-2" />
            Commit Categories
          </CardTitle>
          <CardDescription>
            No categorized commits available. Use the &quot;Categorize All Commits&quot; feature to analyze commit types.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.icon}</span>
            <span className="font-semibold">{data.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.value} commits ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-1 justify-center mt-4 max-w-full">
        {payload?.map((entry: any, index: number) => (
          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
            <span className="mr-1">{entry.payload.icon}</span>
            <span className="truncate max-w-20">{entry.value}</span>
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tags className="h-5 w-5 mr-2" />
          Commit Categories
        </CardTitle>
        <CardDescription>
          Distribution of {totalCategorizedCommits} categorized commits across different types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage, value }) =>
                  percentage > 3 ? `${name} (${percentage.toFixed(1)}%)` : ''
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
