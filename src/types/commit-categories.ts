/**
 * @fileOverview Types and utilities for commit categorization
 */

export const COMMIT_CATEGORIES = [
  'bugfix',
  'feature', 
  'refactor',
  'documentation',
  'test',
  'chore',
  'styling',
  'performance',
  'security',
  'backend',
  'frontend',
  'database',
  'API',
  'UI',
  'UX',
  'build',
  'ci/cd',
  'dependencies',
  'other'
] as const;

export type CommitCategory = typeof COMMIT_CATEGORIES[number];

export interface CategorizedCommit {
  sha: string;
  message: string;
  categories: CommitCategory[];
}

export interface CommitCategoryStats {
  category: CommitCategory;
  count: number;
  percentage: number;
  color: string;
}

export const CATEGORY_COLORS: Record<CommitCategory, string> = {
  'bugfix': '#ef4444',      // red
  'feature': '#22c55e',     // green
  'refactor': '#3b82f6',    // blue
  'documentation': '#8b5cf6', // purple
  'test': '#f59e0b',        // amber
  'chore': '#6b7280',       // gray
  'styling': '#ec4899',     // pink
  'performance': '#10b981', // emerald
  'security': '#dc2626',    // red-600
  'backend': '#1f2937',     // gray-800
  'frontend': '#06b6d4',    // cyan
  'database': '#7c3aed',    // violet
  'API': '#059669',         // emerald-600
  'UI': '#db2777',          // pink-600
  'UX': '#be185d',          // pink-700
  'build': '#d97706',       // amber-600
  'ci/cd': '#0891b2',       // cyan-600
  'dependencies': '#4338ca', // indigo-600
  'other': '#9ca3af'        // gray-400
};

export const CATEGORY_ICONS: Record<CommitCategory, string> = {
  'bugfix': '🐛',
  'feature': '✨',
  'refactor': '♻️',
  'documentation': '📚',
  'test': '🧪',
  'chore': '🔧',
  'styling': '💄',
  'performance': '⚡',
  'security': '🔒',
  'backend': '⚙️',
  'frontend': '🎨',
  'database': '🗄️',
  'API': '🔌',
  'UI': '🖼️',
  'UX': '👤',
  'build': '🏗️',
  'ci/cd': '🚀',
  'dependencies': '📦',
  'other': '❓'
};

export function getCategoryColor(category: CommitCategory): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

export function getCategoryIcon(category: CommitCategory): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
}

export function calculateCategoryStats(categorizedCommits: CategorizedCommit[]): CommitCategoryStats[] {
  const categoryCount: Record<string, number> = {};
  const totalCommits = categorizedCommits.length;

  // Count categories (commits can have multiple categories)
  categorizedCommits.forEach(commit => {
    commit.categories.forEach(category => {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
  });

  // Convert to stats array
  return Object.entries(categoryCount)
    .map(([category, count]) => ({
      category: category as CommitCategory,
      count,
      percentage: totalCommits > 0 ? (count / totalCommits) * 100 : 0,
      color: getCategoryColor(category as CommitCategory)
    }))
    .sort((a, b) => b.count - a.count);
}
