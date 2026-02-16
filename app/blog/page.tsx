import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | Sanstoolow 小站",
  description: "Sanstoolow Blog 静态展示页，收纳开发记录与学习笔记。",
};

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  readingTime: string;
};

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "from-workspace-to-blog",
    title: "从 Workspace 到 Blog：小站结构第一次拆分",
    excerpt: "把编辑器工具页和内容展示页分开，让首页承担真正的站点入口角色。",
    date: "2026-02-12",
    tag: "Architecture",
    readingTime: "5 min",
  },
  {
    slug: "designing-a-lightweight-note-flow",
    title: "轻量写作流设计：为什么先做静态展示",
    excerpt: "在需求尚未完全确定前，先做静态卡片可以更快验证信息结构和视觉表达。",
    date: "2026-02-06",
    tag: "Product",
    readingTime: "4 min",
  },
  {
    slug: "next16-small-station-practice",
    title: "Next.js 16 小站实践笔记",
    excerpt: "围绕 App Router、metadata 和样式变量，建立可迭代的小站基础骨架。",
    date: "2026-01-28",
    tag: "Next.js",
    readingTime: "6 min",
  },
  {
    slug: "ui-rhythm-and-reading",
    title: "信息节奏与可读性：卡片布局的细节取舍",
    excerpt: "从标题层级、摘要长度到状态标识，如何让内容浏览更顺手。",
    date: "2026-01-12",
    tag: "UI",
    readingTime: "3 min",
  },
];

const TOPICS = ["Frontend", "Engineering", "Learning Notes", "Design Thinking"];

export default function BlogPage() {
  return (
    <main className="stagger-rise-1">
      <div className="shell">
        <nav className="blog-topbar" aria-label="Blog navigation">
          <Link className="btn btn-ghost" href="/">
            ← 返回首页
          </Link>
          <Link className="btn btn-primary" href="/workspace">
            打开 Workspace
          </Link>
        </nav>

        <header className="blog-hero">
          <span className="blog-kicker">~/blog</span>
          <h1 className="blog-title">开发记录与思考草稿</h1>
          <p className="blog-subtitle">
            这是第一版静态展示页面，先完成目录感与浏览体验，后续再接入完整文章详情页。
          </p>

          <div className="blog-topics" aria-label="Topics">
            {TOPICS.map((topic) => (
              <span key={topic} className="tag">
                {topic}
              </span>
            ))}
          </div>
        </header>

        <section className="blog-grid" aria-label="Blog posts">
          {BLOG_POSTS.map((post, index) => (
            <article
              key={post.slug}
              className={`card blog-card stagger-rise-${Math.min(index + 2, 4)}`}
            >
              <div className="blog-card-meta">
                <span>{post.date}</span>
                <span>{post.tag}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="blog-card-footer">
                <span>{post.readingTime}</span>
                <span className="tag">静态展示</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
