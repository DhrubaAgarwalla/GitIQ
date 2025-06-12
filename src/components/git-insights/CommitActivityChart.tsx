
'use client';

import type { GithubCommit } from '@/lib/github';
import { useMemo, useState, useEffect } from 'react';
import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  getWeek,
} from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Activity } from 'lucide-react';

interface CommitActivityChartProps {
  commits: GithubCommit[];
}

interface ChartDataPoint {
  date: string; // Formatted for X-axis (e.g., 'MMM d', 'Www yy', 'MMM yy')
  commits: number;
  fullDate: string; // Original YYYY-MM-DD for daily, or start of period for weekly/monthly
  periodType: 'day' | 'week' | 'month';
  periodLabel: string; // User-friendly label for tooltip (e.g., "October 26, 2023", "Week of Oct 22, 2023", "October 2023")
}

const chartConfig = {
  commits: {
    label: 'Commits',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function CommitActivityChart({ commits }: CommitActivityChartProps) {
  // Hook to track screen size for responsive design
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      setIsSmallMobile(window.innerWidth < 480); // small mobile
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const { chartData, aggregationLevel } = useMemo(() => {
    if (!commits || commits.length === 0) {
      return { chartData: [], aggregationLevel: 'day' as const };
    }

    const dailyCommits: Record<string, number> = {};
    // Calculate min and max dates for determining the span, not strictly needed for current aggregation logic but good practice
    // let minCommitDate = parseISO(commits[0].commit.author.date);
    // let maxCommitDate = parseISO(commits[0].commit.author.date);

    commits.forEach(commit => {
      const commitDate = parseISO(commit.commit.author.date);
      // if (commitDate < minCommitDate) minCommitDate = commitDate;
      // if (commitDate > maxCommitDate) maxCommitDate = commitDate;
      const day = format(startOfDay(commitDate), 'yyyy-MM-dd');
      dailyCommits[day] = (dailyCommits[day] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyCommits).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const uniqueDaysCount = sortedDays.length;

    let level: 'day' | 'week' | 'month' = 'day';
    let processedData: ChartDataPoint[];

    if (uniqueDaysCount > 90) { // Threshold for switching from daily
      const weeklyCommits: Record<string, { count: number }> = {};
      sortedDays.forEach(dayStr => {
        const date = parseISO(dayStr);
        // Using weekStartsOn: 1 for Monday as the start of the week, common for ISO week numbers
        const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        if (!weeklyCommits[weekStart]) {
          weeklyCommits[weekStart] = { count: 0 };
        }
        weeklyCommits[weekStart].count += dailyCommits[dayStr];
      });
      const uniqueWeeksCount = Object.keys(weeklyCommits).length;

      if (uniqueWeeksCount <= 80) { // Threshold for using weekly (approx 1.5 years of weekly data)
        level = 'week';
        processedData = Object.entries(weeklyCommits)
          .map(([weekStartStr, data]) => {
            const weekStartDate = parseISO(weekStartStr);
            return {
              date: `W${getWeek(weekStartDate, { weekStartsOn: 1 })} '${format(weekStartDate, 'yy')}`,
              commits: data.count,
              fullDate: weekStartStr,
              periodType: 'week' as const,
              periodLabel: `Week of ${format(weekStartDate, 'MMM d, yyyy')}`,
            };
          })
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
      } else { // Switch to monthly
        level = 'month';
        const monthlyCommits: Record<string, { count: number }> = {};
        sortedDays.forEach(dayStr => {
          const date = parseISO(dayStr);
          const monthStart = format(startOfMonth(date), 'yyyy-MM-dd');
          if (!monthlyCommits[monthStart]) {
            monthlyCommits[monthStart] = { count: 0 };
          }
          monthlyCommits[monthStart].count += dailyCommits[dayStr];
        });
        processedData = Object.entries(monthlyCommits)
          .map(([monthStartStr, data]) => {
            const monthStartDate = parseISO(monthStartStr);
            return {
              date: format(monthStartDate, 'MMM yy'),
              commits: data.count,
              fullDate: monthStartStr,
              periodType: 'month' as const,
              periodLabel: format(monthStartDate, 'MMMM yyyy'),
            };
          })
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
      }
    } else { // Default to daily
      level = 'day';
      processedData = sortedDays.map(day => ({
        date: format(parseISO(day), 'MMM d'),
        commits: dailyCommits[day],
        fullDate: day,
        periodType: 'day' as const,
        periodLabel: format(parseISO(day), 'MMMM d, yyyy'),
      }));
    }
    return { chartData: processedData, aggregationLevel: level };
  }, [commits]);

  const cardDescriptionText = useMemo(() => {
    switch (aggregationLevel) {
      case 'day':
        return 'Number of commits per day from the loaded data.';
      case 'week':
        return 'Number of commits per week from the loaded data.';
      case 'month':
        return 'Number of commits per month from the loaded data.';
      default:
        return 'Commit activity from the loaded data.';
    }
  }, [aggregationLevel]);


  if (commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Commit Activity Over Time</CardTitle>
          <CardDescription>No commit data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Fetch commits to see activity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
         <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Commit Activity Over Time</CardTitle>
        <CardDescription>{cardDescriptionText}</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? 'p-4' : 'p-6'}>
        <ChartContainer
          config={chartConfig}
          className={`w-full ${
            isMobile
              ? isSmallMobile ? 'h-[280px]' : 'h-[320px]'
              : 'h-[300px]'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: isMobile ? 10 : 20,
                left: isMobile ? -30 : -20,
                bottom: isMobile ? 20 : 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={isMobile ? 10 : 12}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
                interval={isMobile ? Math.max(0, Math.floor(chartData.length / 6)) : 0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={isMobile ? 10 : 12}
                width={isMobile ? 30 : 40}
               />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, props) => {
                      const dataPoint = props.payload as ChartDataPoint;
                      if (!dataPoint) return null; // Should not happen with active tooltip

                      return (
                        <div className={`grid gap-0.5 p-1 ${
                          isMobile ? 'min-w-[120px]' : 'min-w-[150px]'
                        }`}>
                          <p className={`font-medium text-foreground ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            {dataPoint.periodLabel}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-muted-foreground ${
                              isMobile ? 'text-xs' : 'text-sm'
                            }`}>
                              {chartConfig.commits.label}:
                            </span>
                            <span className={`font-medium font-mono ml-2 tabular-nums text-foreground ${
                              isMobile ? 'text-xs' : 'text-sm'
                            }`}>
                              {value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              {!isSmallMobile && <Legend />}
              <Bar
                dataKey="commits"
                fill="var(--color-commits)"
                radius={isMobile ? 2 : 4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
