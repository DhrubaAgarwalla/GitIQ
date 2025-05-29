import { Brain } from 'lucide-react';

export function Header() {
  return (
    <header className="mb-8 text-center">
      <div className="inline-flex items-center justify-center">
        <Brain className="h-12 w-12 text-primary mr-3" />
        <h1 className="text-4xl font-bold text-primary">GitIQ</h1>
      </div>
      <p className="text-muted-foreground mt-2 text-lg">
        Make your Git smarter.
      </p>
    </header>
  );
}
