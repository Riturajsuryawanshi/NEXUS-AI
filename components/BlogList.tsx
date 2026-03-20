import React, { useState } from 'react';
import { motion } from 'framer-motion';
import articles, { BlogArticle } from '../data/blogArticles';

interface BlogListProps {
    onSelectArticle: (slug: string) => void;
    onBack: () => void;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
    const colors: Record<string, string> = {
        'Guide': 'bg-indigo-50 text-indigo-700 border-indigo-100',
        'Industry Guide': 'bg-orange-50 text-orange-700 border-orange-100',
        'Agency Playbook': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'Case Study': 'bg-purple-50 text-purple-700 border-purple-100',
    };
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${colors[category] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            {category}
        </span>
    );
};

const ArticleCard: React.FC<{ article: BlogArticle; onClick: () => void; index: number; featured?: boolean }> = ({ article, onClick, index, featured }) => (
    <motion.article
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.5 }}
        onClick={onClick}
        className={`group cursor-pointer bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${featured ? 'md:col-span-2' : ''}`}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Read article: ${article.title}`}
    >
        {/* Cover */}
        <div className={`h-48 ${featured ? 'md:h-64' : ''} bg-gradient-to-br ${article.coverColor} relative overflow-hidden flex items-end p-8`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
                <CategoryBadge category={article.category} />
            </div>
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Content */}
        <div className="p-8">
            <h2 className={`font-display font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                {article.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{article.excerpt}</p>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                        N
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700">{article.author}</p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {article.readTime}
                        </p>
                    </div>
                </div>
                <span className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                    <i className="fas fa-arrow-right text-xs transform group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
                {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-lg">
                        #{tag.replace(/\s+/g, '')}
                    </span>
                ))}
            </div>
        </div>
    </motion.article>
);

export const BlogList: React.FC<BlogListProps> = ({ onSelectArticle, onBack }) => {
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];
    const filtered = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory);
    const featured = filtered.filter(a => a.featured);
    const regular = filtered.filter(a => !a.featured);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        aria-label="Back to home"
                    >
                        <i className="fas fa-arrow-left text-xs" />
                        Home
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-md flex items-center justify-center text-white text-[10px] font-black">N</div>
                        <span className="font-display font-black text-slate-900 text-sm">Blog</span>
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-400 mb-4 block">
                            Nexus Analyst Intelligence
                        </span>
                        <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-6">
                            Insights on AI<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                Business Intelligence
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl">
                            Guides, strategies, and case studies on using AI to analyze Google reviews, benchmark competitors, and grow your business.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase whitespace-nowrap transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Articles Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                {featured.length > 0 && (
                    <section className="mb-16">
                        <h2 className="text-xs font-black tracking-[0.3em] uppercase text-slate-400 mb-8">Featured</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featured.map((article, i) => (
                                <ArticleCard
                                    key={article.slug}
                                    article={article}
                                    onClick={() => onSelectArticle(article.slug)}
                                    index={i}
                                    featured={false}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {regular.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black tracking-[0.3em] uppercase text-slate-400 mb-8">All Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {regular.map((article, i) => (
                                <ArticleCard
                                    key={article.slug}
                                    article={article}
                                    onClick={() => onSelectArticle(article.slug)}
                                    index={i}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <i className="fas fa-file-pen text-4xl mb-4 block opacity-30" />
                        <p>No articles in this category yet. Check back soon!</p>
                    </div>
                )}
            </div>

            {/* CTA Banner */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20 px-6 mt-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-display font-black mb-6">
                        Ready to Analyze Your Business?
                    </h2>
                    <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
                        Generate a complete AI business intelligence report from any Google Maps link — in under 60 seconds.
                    </p>
                    <button
                        onClick={onBack}
                        className="px-12 py-5 bg-white text-indigo-700 rounded-full text-sm font-black tracking-widest uppercase hover:bg-indigo-50 transition-all shadow-2xl hover:scale-105 active:scale-95"
                    >
                        Try for Free
                    </button>
                </div>
            </div>
        </div>
    );
};
