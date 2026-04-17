
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function AuthorBox({ author }) {
  if (!author) return null;

  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-lg">
              {author.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">About the Author</h4>
            <p className="font-medium text-lg mb-2">{author.name}</p>
            <p className="text-sm leading-relaxed">{author.bio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthorBox;
