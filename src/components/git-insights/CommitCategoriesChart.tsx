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
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <Badge key={index} variant="outline" className="text-xs">
            <span className="mr-1">{entry.payload.icon}</span>
            {entry.value}
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
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
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

        {/* Category Statistics List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Category Breakdown</h4>
          {categoryStats.map((stat, index) => (
            <div key={stat.category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getCategoryIcon(stat.category)}</span>
                <div>
                  <span className="font-medium">{stat.category}</span>
                  <p className="text-sm text-muted-foreground">
                    {stat.count} commits ({stat.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <Badge variant="secondary">{stat.count}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
