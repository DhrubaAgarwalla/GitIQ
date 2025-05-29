
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const GITHUB_REPO_URL_REGEX = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?\/?$/;

const formSchema = z.object({
  repoUrl: z.string()
    .min(1, 'Repository URL is required')
    .url('Please enter a valid URL.')
    .regex(GITHUB_REPO_URL_REGEX, 'Invalid GitHub repository URL. Example: https://github.com/username/repo'),
});

type RepoFormValues = z.infer<typeof formSchema>;

interface RepoFormProps {
  onFetchCommits: (username: string, repository: string) => Promise<void>;
  isLoading: boolean;
}

export function RepoForm({ onFetchCommits, isLoading }: RepoFormProps) {
  const form = useForm<RepoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: '',
    },
  });

  const onSubmit = async (values: RepoFormValues) => {
    const match = values.repoUrl.match(GITHUB_REPO_URL_REGEX);
    if (match && match[1] && match[2]) {
      const username = match[1];
      const repository = match[2];
      await onFetchCommits(username, repository);
    } else {
      // This should ideally be caught by Zod validation, but as a fallback
      form.setError('repoUrl', {
        type: 'manual',
        message: 'Could not parse username and repository from the URL. Please ensure it is a valid GitHub repository URL.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-4 sm:p-6 rounded-lg shadow-md mb-8">
        <FormField
          control={form.control}
          name="repoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub Repository URL</FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://github.com/facebook/react" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            'Fetch Commits'
          )}
        </Button>
      </form>
    </Form>
  );
}
