
import type { CommitCategory } from '@/types/commit-categories';

// Using a more specific author type from the commit object for consistency
export interface GithubCommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string; // Added to match ContributorList usage
}

export interface GithubCommitStats {
  additions: number;
  deletions: number;
  total: number;
}

export interface GithubCommit {
  sha: string;
  commit: {
    author: GithubCommitAuthor;
    committer: GithubCommitAuthor;
    message: string;
  };
  author: GithubUser | null; // Can be null if the author is not a GitHub user
  committer: GithubUser | null; // Can be null if the committer is not a GitHub user
  html_url: string;
  parents: { sha: string; url: string; html_url: string }[];
  stats?: GithubCommitStats;
  categories?: CommitCategory[]; // AI-generated categories for the commit
}

export interface GithubRepoDetails {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
  } | null;
  owner: GithubUser;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  topics: string[];
}

interface GithubReadme {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string; // Base64 encoded content
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

const MAX_README_CONTENT_LENGTH = 15000; // Max characters to send to AI

async function fetchCommitStats(owner: string, repo: string, sha: string, token?: string): Promise<GithubCommitStats | null> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, { headers });
    if (!response.ok) {
      if (response.status !== 404 && response.status !== 422) {
         console.warn(`Failed to fetch stats for commit ${sha}: ${response.statusText} (${response.status})`);
      }
      return null;
    }
    const data = await response.json();
    return data.stats as GithubCommitStats;
  } catch (error) {
    console.error(`Error fetching stats for commit ${sha}:`, error);
    return null;
  }
}

export async function fetchCommits(username: string, repo: string, page: number = 1, token?: string): Promise<{ commits: GithubCommit[], hasNextPage: boolean }> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com/repos/${username}/${repo}/commits?per_page=100&page=${page}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository not found: ${username}/${repo}. Please check the URL and ensure the repository is public.`);
    }
    if (response.status === 403) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'a few minutes';
      throw new Error(`API rate limit exceeded. Please try again ${resetTime}.`);
    }
    throw new Error(`Failed to fetch commits: ${response.statusText} (${response.status})`);
  }
  const commitListData = await response.json() as GithubCommit[];
  const linkHeader = response.headers.get('Link');

  const hasNextPage = commitListData.length > 0 && linkHeader ? linkHeader.includes('rel="next"') : false;

  const finalCommits: GithubCommit[] = [];
  const commitStatPromises = commitListData.map(commit => fetchCommitStats(username, repo, commit.sha, token));

  const settledStats = await Promise.allSettled(commitStatPromises);

  commitListData.forEach((commit, index) => {
    const statResult = settledStats[index];
    let stats: GithubCommitStats | undefined = undefined;
    if (statResult.status === 'fulfilled' && statResult.value) {
      stats = statResult.value;
    }
    finalCommits.push({ ...commit, stats });
  });

  return { commits: finalCommits, hasNextPage };
}

export async function fetchRepoDetails(username: string, repo: string, token?: string): Promise<GithubRepoDetails> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository details not found: ${username}/${repo}. Please check the URL and ensure the repository is public.`);
    }
     if (response.status === 403) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'a few minutes';
      throw new Error(`API rate limit exceeded while fetching repository details. Please try again ${resetTime}.`);
    }
    throw new Error(`Failed to fetch repository details: ${response.statusText} (${response.status})`);
  }
  const data = await response.json();
  return data as GithubRepoDetails;
}


export async function getRepoTotalCommitsViaLinkHeader(
  owner: string,
  repo: string,
  token?: string
): Promise<number | string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return `Error: Repository '${owner}/${repo}' not found.`;
      }
       if (response.status === 422) {
        console.warn(`Got 422 fetching total commits via Link header for ${owner}/${repo}. Repo might be empty or not yet processed.`);
        return `Info: Repository '${owner}/${repo}' may be empty or not yet processed by GitHub for commit listing via Link header. Assuming 0 commits for now.`;
      }
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        const resetTime = rateLimitReset
          ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
          : 'later';
        console.warn(`GitHub API rate limit exceeded (403) when fetching total commits via Link header for ${owner}/${repo}.`);
        return `Error: GitHub API rate limit exceeded. Please try again ${resetTime}.`;
      }
      console.warn(`Failed to fetch total commits via Link header for ${owner}/${repo}: ${response.status} ${response.statusText}`);
      return `Error: Failed to fetch commits. Status: ${response.status} ${response.statusText}`;
    }

    const linkHeader = response.headers.get('Link');

    if (linkHeader) {
      const links = linkHeader.split(',').map(part => part.trim());
      const lastLinkPart = links.find(part => part.includes('rel="last"'));

      if (lastLinkPart) {
        const urlMatch = lastLinkPart.match(/<([^>]+)>/);
        if (urlMatch && urlMatch[1]) {
          const lastUrl = new URL(urlMatch[1]);
          const lastPage = lastUrl.searchParams.get('page');
          if (lastPage && !isNaN(parseInt(lastPage))) {
            return parseInt(lastPage);
          } else {
             const data = await response.json();
             if (Array.isArray(data) && data.length === 1) return 1;
             return 'Error: Could not parse page number from the "last" link in Link header.';
          }
        } else {
          return 'Error: Could not extract URL from the "last" link part in Link header.';
        }
      }
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      if (data.length === 0) return 0;
      if (data.length === 1 && (!linkHeader || (!linkHeader.includes('rel="next"') && !linkHeader.includes('rel="last"')))) {
        return 1;
      }
    }
    return `Info: Could not determine total commit count using the Link header method (no "last" link found). The repository might be very small or empty.`;

  } catch (error) {
    console.error('Unexpected error in getRepoTotalCommitsViaLinkHeader:', error);
    if (error instanceof Error) {
      return `Error: An unexpected error occurred: ${error.message}`;
    }
    return 'Error: An unexpected error occurred.';
  }
}

export async function fetchReadmeInfo(
  owner: string,
  repo: string,
  token?: string
): Promise<{ name: string; content: string } | null> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No README found for ${owner}/${repo}`);
        return null;
      }
      console.warn(`Failed to fetch README for ${owner}/${repo}: ${response.statusText} (${response.status})`);
      return null;
    }
    const readmeData = (await response.json()) as GithubReadme;

    if (readmeData.content) {
      // Decode Base64 content
      let decodedContent = '';
      if (typeof window !== 'undefined') { // Check if running in browser
        decodedContent = window.atob(readmeData.content);
      } else { // Fallback for Node.js environment (e.g. server-side rendering if ever used)
        decodedContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }

      // Truncate if necessary
      if (decodedContent.length > MAX_README_CONTENT_LENGTH) {
        console.log(`README for ${owner}/${repo} truncated from ${decodedContent.length} to ${MAX_README_CONTENT_LENGTH} characters for AI summary.`);
        decodedContent = decodedContent.substring(0, MAX_README_CONTENT_LENGTH) + "\n\n[README content truncated]";
      }
      return { name: readmeData.name, content: decodedContent };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching or processing README for ${owner}/${repo}:`, error);
    return null;
  }
}
