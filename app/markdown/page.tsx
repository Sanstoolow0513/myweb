"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Doc = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type ViewMode = "split" | "editor" | "preview";
type EditableField = "title" | "content";

const NEW_DOC_TITLE = "Untitled note";
const NEW_DOC_CONTENT = "# New note\n\nStart writing your Markdown here.";

function isDoc(value: unknown): value is Doc {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    typeof data.title === "string" &&
    typeof data.content === "string" &&
    typeof data.createdAt === "string" &&
    typeof data.updatedAt === "string"
  );
}

function isDocArray(value: unknown): value is Doc[] {
  return Array.isArray(value) && value.every(isDoc);
}

function signatureOf(doc: Pick<Doc, "title" | "content">): string {
  return `${doc.title}\u001f${doc.content}`;
}

function formatTime(isoText: string): string {
  const date = new Date(isoText);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MarkdownPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const docsRef = useRef<Doc[]>([]);
  const syncedSignaturesRef = useRef<Map<string, string>>(new Map());
  const saveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  // Adjust viewMode based on window width to avoid squeezing
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024 && viewMode === "split") {
        setViewMode("editor");
      }
    };
    window.addEventListener("resize", checkWidth);
    checkWidth();
    return () => window.removeEventListener("resize", checkWidth);
  }, [viewMode]);

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeDocId) ?? null,
    [docs, activeDocId],
  );

  const saveDocNow = useCallback(async (docId: string) => {
    const currentDoc = docsRef.current.find((doc) => doc.id === docId);

    if (!currentDoc) {
      return;
    }

    const latestSignature = signatureOf(currentDoc);
    const syncedSignature = syncedSignaturesRef.current.get(docId);

    if (latestSignature === syncedSignature) {
      setSaveState("saved");
      return;
    }

    setSaveState("saving");

    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: currentDoc.title,
          content: currentDoc.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const payload = (await response.json()) as { data?: unknown };

      if (!isDoc(payload.data)) {
        throw new Error("Invalid response payload");
      }

      const updatedDoc = payload.data;
      syncedSignaturesRef.current.set(updatedDoc.id, signatureOf(updatedDoc));

      setDocs((previous) => {
        const next = previous.map((doc) =>
          doc.id === updatedDoc.id ? updatedDoc : doc,
        );

        next.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
        return next;
      });

      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDocs() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/docs", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load documents");
        }

        const payload = (await response.json()) as { data?: unknown };

        if (!isDocArray(payload.data)) {
          throw new Error("Invalid response payload");
        }

        if (cancelled) {
          return;
        }

        const loadedDocs = payload.data;
        setDocs(loadedDocs);
        setActiveDocId(loadedDocs[0]?.id ?? null);

        syncedSignaturesRef.current = new Map(
          loadedDocs.map((doc) => [doc.id, signatureOf(doc)]),
        );

        setSaveState("saved");
      } catch {
        if (!cancelled) {
          setLoadError("文档加载失败，请刷新页面重试。");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeDoc) {
      return;
    }

    const currentSignature = signatureOf(activeDoc);
    const syncedSignature = syncedSignaturesRef.current.get(activeDoc.id);

    if (currentSignature === syncedSignature) {
      return;
    }

    setSaveState("saving");

    const timeoutId = window.setTimeout(() => {
      void saveDocNow(activeDoc.id);
    }, 800);

    saveTimerRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);

      if (saveTimerRef.current === timeoutId) {
        saveTimerRef.current = undefined;
      }
    };
  }, [activeDoc, saveDocNow]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== undefined) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const handleSelectDoc = useCallback(
    (docId: string) => {
      if (docId === activeDocId) {
        return;
      }

      if (saveTimerRef.current !== undefined) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = undefined;
      }

      if (activeDocId) {
        void saveDocNow(activeDocId);
      }

      setActiveDocId(docId);
      setSaveState("idle");
    },
    [activeDocId, saveDocNow],
  );

  const updateActiveDoc = useCallback(
    (field: EditableField, value: string) => {
      if (!activeDocId) {
        return;
      }

      setDocs((previous) =>
        previous.map((doc) =>
          doc.id === activeDocId
            ? {
                ...doc,
                [field]: value,
              }
            : doc,
        ),
      );
    },
    [activeDocId],
  );

  const handleCreateDoc = useCallback(async () => {
    if (isCreating) {
      return;
    }

    if (saveTimerRef.current !== undefined) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }

    if (activeDocId) {
      await saveDocNow(activeDocId);
    }

    setIsCreating(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: NEW_DOC_TITLE,
          content: NEW_DOC_CONTENT,
        }),
      });

      if (!response.ok) {
        throw new Error("Create failed");
      }

      const payload = (await response.json()) as { data?: unknown };

      if (!isDoc(payload.data)) {
        throw new Error("Invalid response payload");
      }

      const newDoc = payload.data;

      syncedSignaturesRef.current.set(newDoc.id, signatureOf(newDoc));

      setDocs((previous) => [newDoc, ...previous]);
      setActiveDocId(newDoc.id);
      setViewMode("editor");
      setSaveState("saved");
    } catch {
      setLoadError("新建文档失败，请稍后重试。");
    } finally {
      setIsCreating(false);
    }
  }, [activeDocId, isCreating, saveDocNow]);

  const handleDeleteDoc = useCallback(async (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm("确定要删除这篇文档吗？")) {
      return;
    }

    if (saveTimerRef.current !== undefined && activeDocId === docId) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }

    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setDocs((previous) => {
        const next = previous.filter((doc) => doc.id !== docId);
        if (activeDocId === docId) {
          setActiveDocId(next[0]?.id ?? null);
        }
        return next;
      });
      syncedSignaturesRef.current.delete(docId);
    } catch {
      alert("删除失败，请稍后重试。");
    }
  }, [activeDocId]);

  const handleManualSave = useCallback(() => {
    if (!activeDocId) {
      return;
    }

    if (saveTimerRef.current !== undefined) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }

    void saveDocNow(activeDocId);
  }, [activeDocId, saveDocNow]);

  const hasUnsavedChanges = useMemo(() => {
    if (!activeDoc) {
      return false;
    }

    return signatureOf(activeDoc) !== syncedSignaturesRef.current.get(activeDoc.id);
  }, [activeDoc]);

  const saveLabel = useMemo(() => {
    if (!activeDoc) {
      return "未选择文档";
    }

    if (saveState === "saving") {
      return "保存中...";
    }

    if (saveState === "error") {
      return "保存失败";
    }

    return hasUnsavedChanges ? "待保存" : "已保存";
  }, [activeDoc, hasUnsavedChanges, saveState]);

  return (
    <main className="site-page workspace-main particle-bg">
      {loadError ? <p className="error-banner">{loadError}</p> : null}

      {isLoading ? (
        <p className="loading">正在加载文档...</p>
      ) : (
        <div className="workspace-grid">
          <aside className="workspace-sidebar" aria-label="Document list">
            <div className="workspace-header stagger-rise-1">
              <div className="workspace-header-title">
                <strong>文档列表</strong>
                <span className="workspace-count">{docs.length} 篇</span>
              </div>

              <div className="workspace-actions">
                <span className={`workspace-status ${saveState === "saving" ? "saving" : ""}`}>
                  {saveLabel}
                </span>
                <div className="workspace-actions-row">
                  <button
                    className="btn btn-secondary"
                    onClick={handleManualSave}
                    disabled={!activeDocId}
                    style={{ minHeight: '36px', padding: '0 10px', fontSize: '0.75rem' }}
                  >
                    保存
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateDoc}
                    disabled={isCreating}
                    style={{ minHeight: '36px', padding: '0 10px', fontSize: '0.75rem' }}
                  >
                    {isCreating ? "创建中..." : "新建"}
                  </button>
                </div>
              </div>
            </div>

            <div className="workspace-doc-list">
              {docs.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`doc-item stagger-rise-2 ${doc.id === activeDocId ? "is-active" : ""}`}
                  onClick={() => handleSelectDoc(doc.id)}
                  style={{ animationDelay: `${index * 50}ms`, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                    <div className="doc-item-title">{doc.title.trim() || NEW_DOC_TITLE}</div>
                    <div className="doc-item-time">更新于 {formatTime(doc.updatedAt)}</div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="删除"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="view-switch-bar" style={{ display: 'flex', padding: '10px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: 'auto', fontFamily: 'var(--font-mono)' }}>视图模式:</span>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-primary)',
                  background: viewMode === "editor" ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: viewMode === "editor" ? 'var(--accent-text)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onClick={() => setViewMode("editor")}
              >
                📝 仅编辑
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-primary)',
                  background: viewMode === "split" ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: viewMode === "split" ? 'var(--accent-text)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onClick={() => setViewMode("split")}
              >
                📖 双栏分屏
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-primary)',
                  background: viewMode === "preview" ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: viewMode === "preview" ? 'var(--accent-text)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onClick={() => setViewMode("preview")}
              >
                👁️ 仅预览
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              {(viewMode === "editor" || viewMode === "split") && (
                <section className="editor-pane" style={{ flex: 1, borderRight: viewMode === "split" ? '1px solid var(--border-primary)' : 'none', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div className="pane-header">
                    <span className="pane-title">Editor</span>
                    <span className="pane-meta">{activeDoc ? `${activeDoc.content.length} chars` : ""}</span>
                  </div>

                  <div className="editor-body">
                    <input
                      id="doc-title"
                      className="editor-title-input"
                      value={activeDoc?.title ?? ""}
                      placeholder="Untitled note"
                      onChange={(event) => updateActiveDoc("title", event.target.value)}
                    />

                    <textarea
                      className="editor-textarea"
                      value={activeDoc?.content ?? ""}
                      spellCheck={false}
                      onChange={(event) => updateActiveDoc("content", event.target.value)}
                      placeholder="Write your markdown here..."
                      style={{ height: '100%', resize: 'none' }}
                    />
                  </div>
                </section>
              )}

              {(viewMode === "preview" || viewMode === "split") && (
                <section className="preview-pane" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div className="pane-header">
                    <span className="pane-title">Preview</span>
                    <span className="pane-meta">{activeDoc ? formatTime(activeDoc.updatedAt) : ""}</span>
                  </div>

                  <div className="preview-body" style={{ height: '100%', overflowY: 'auto' }}>
                    {activeDoc?.content ? (
                      <article className="markdown-preview">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {activeDoc.content}
                        </ReactMarkdown>
                      </article>
                    ) : (
                      <div className="preview-empty">
                        <div className="preview-empty-content">
                          <p>在左侧输入 Markdown，右侧会实时预览</p>
                          <small>支持标题、列表、代码块、表格等</small>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
