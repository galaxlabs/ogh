
import React from 'react';
import ArticleCard from './ArticleCard.jsx';

function RelatedPosts({ articles, currentArticleId }) {
  const relatedArticles = articles
    .filter(article => article.id !== currentArticleId)
    .slice(0, 3);

  if (relatedArticles.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">Related Posts</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {relatedArticles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </div>
    </section>
  );
}

export default RelatedPosts;
