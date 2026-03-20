import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import articles, { BlogArticle } from '../data/blogArticles';

interface BlogPostProps {
    slug: string;
    onBack: () => void;
    onBackToBlog: () => void;
}

const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
    const headings = Array.from(content.matchAll(/<h2>(.*?)<\/h2>|<h3>(.*?)<\/h3>/g)).map(m => ({
        level: m[0].startsWith('<h2') ? 2 : 3,
        text: (m[1] || m[2]).replace(/<[^>]+>/g, ''),
    }));

    if (headings.length === 0) return null;

    return (
        <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-400 mb-4">Table of Contents</p>
            <ol className="space-y-2">
                {headings.map((h, i) => (
                    <li key={i} className={`text-sm ${h.level === 3 ? 'ml-4' : ''}`}>
                        <span className="text-slate-400 mr-2">{i + 1}.</span>
                        <span className="text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors">{h.text}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export const BlogPost: React.FC<BlogPostProps> = ({ slug, onBack, onBackToBlog }) => {
    const article = articles.find(a => a.slug === slug);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Update document title for SEO
        if (article) {
            document.title = `${article.title} | Nexus Analyst Blog`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', article.excerpt);
        }
        return () => {
            document.title = 'Nexus Analyst — AI Business Intelligence from Google Maps Reviews';
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', 'Turn any Google Maps listing into a full AI-powered business audit in seconds. Sentiment analysis, competitor benchmarking, and actionable insights — free to try. No code required.');
        };
    }, [article]);

    if (!article) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-file-slash text-6xl text-slate-200 mb-4 block" />
                    <h1 className="text-2xl font-bold text-slate-700 mb-2">Article Not Found</h1>
                    <p className="text-slate-400 mb-6">This article doesn't exist or has been moved.</p>
                    <button onClick={onBackToBlog} className="px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold">
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    const relatedArticles = articles.filter(a => a.slug !== slug && a.tags.some(t => article.tags.includes(t))).slice(0, 2);

    return (
        <div className="min-h-screen bg-white">
            {/* Top Nav */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <i className="fas fa-arrow-left text-xs" />
                        Home
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <button
                        onClick={onBackToBlog}
                        className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Blog
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm text-slate-400 truncate max-w-[200px]">{article.title}</span>
                </div>
            </div>

            {/* Hero */}
            <div className={`bg-gradient-to-br ${article.coverColor} text-white pt-20 pb-24 px-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-black tracking-widest uppercase">
                                {article.category}
                            </span>
                            <span className="text-white/60 text-xs">{article.readTime}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-display font-black leading-tight mb-6">
                            {article.title}
                        </h1>
                        <p className="text-white/80 text-lg max-w-2xl mb-8">{article.excerpt}</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
                                N
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{article.author}</p>
                                <p className="text-xs text-white/60">
                                    Published {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
                    {/* Main Article */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-10">
                            {article.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                                    #{tag.replace(/\s+/g, '')}
                                </span>
                            ))}
                        </div>

                        {/* Article HTML Content */}
                        <div
                            className="blog-content prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Share Section */}
                        <div className="mt-16 pt-10 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-700 mb-4">Share this article</p>
                            <div className="flex gap-3">
                                {[
                                    { icon: 'fab fa-twitter', label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('https://nexus.supernovaind.com/blog/' + article.slug)}` },
                                    { icon: 'fab fa-linkedin', label: 'LinkedIn', color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://nexus.supernovaind.com/blog/' + article.slug)}` },
                                    { icon: 'fab fa-whatsapp', label: 'WhatsApp', color: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200', href: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + 'https://nexus.supernovaind.com/blog/' + article.slug)}` },
                                ].map(s => (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 transition-all duration-200 ${s.color}`}
                                        aria-label={`Share on ${s.label}`}
                                    >
                                        <i className={`${s.icon} text-sm`} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <div className="sticky top-20">
                            {/* ToC */}
                            <TableOfContents content={article.content} />

                            {/* CTA Card */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white mb-8">
                                <i className="fas fa-bolt text-2xl mb-4 block text-indigo-300" />
                                <h3 className="font-display font-black text-xl mb-3 leading-tight">
                                    Analyze Any Business in 60 Seconds
                                </h3>
                                <p className="text-indigo-200 text-sm mb-6">
                                    AI-powered review analysis from any Google Maps link. Free to try.
                                </p>
                                <button
                                    onClick={onBack}
                                    className="w-full py-3 bg-white text-indigo-700 rounded-xl text-sm font-black tracking-wide uppercase hover:bg-indigo-50 transition-colors"
                                >
                                    Get Started Free
                                </button>
                            </div>

                            {/* Related Articles */}
                            {relatedArticles.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-400 mb-4">Related Articles</p>
                                    <div className="space-y-4">
                                        {relatedArticles.map(a => (
                                            <div
                                                key={a.slug}
                                                className="group cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all duration-200"
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            >
                                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black tracking-widest uppercase rounded-full mb-2">
                                                    {a.category}
                                                </span>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors leading-snug">
                                                    {a.title}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-1">{a.readTime}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
