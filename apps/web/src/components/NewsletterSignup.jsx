
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

function NewsletterSignup({ compact = false, translations = {} }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    const subscriptions = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
    subscriptions.push({ email, timestamp: new Date().toISOString() });
    localStorage.setItem('newsletter_subscriptions', JSON.stringify(subscriptions));

    setTimeout(() => {
      setIsLoading(false);
      toast.success('Successfully subscribed to newsletter');
      setEmail('');
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'flex flex-col sm:flex-row gap-3 max-w-md mx-auto'}>
      <div className={compact ? 'w-full' : 'flex-1'}>
        <Input
          type="email"
          placeholder={translations.emailPlaceholder || 'Enter your email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="text-foreground bg-background"
        />
      </div>
      <Button type="submit" disabled={isLoading} className={`gap-2 ${compact ? 'w-full' : ''}`}>
        {isLoading ? 'Subscribing...' : (
          <>
            <Mail className="h-4 w-4" />
            {translations.subscribe || 'Subscribe'}
          </>
        )}
      </Button>
    </form>
  );
}

export default NewsletterSignup;
