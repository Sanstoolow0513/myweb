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
type MobilePane = "editor" | "preview";
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

export default function WorkspacePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const docsRef = useRef<Doc[]>([]);
  const syncedSignaturesRef = useRef<Map<string, string>>(new Map());
  const saveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

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
      setMobilePane("editor");
      setSaveState("saved");
    } catch {
      setLoadError("新建文档失败，请稍后重试。");
    } finally {
      setIsCreating(false);
    }
  }, [activeDocId, isCreating, saveDocNow]);

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

  const saveChipClassName = useMemo(() => {
    if (saveState === "error") {
      return "status-chip status-error";
    }

    if (saveState === "saving") {
      return "status-chip status-saving";
    }

    if (hasUnsavedChanges) {
      return "status-chip status-pending";
    }

    return "status-chip status-saved";
  }, [hasUnsavedChanges, saveState]);

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
    <main className="workspace-main">
      {loadError ? <p className="error-banner">{loadError}</p> : null}

      {isLoading ? (
        <p className="loading">正在加载文档...</p>
      ) : (
        <div className="workspace-grid">
          <aside className="workspace-sidebar" aria-label="Document list">
            <div className="workspace-header">
              <div className="workspace-header-title">
                <strong>文档列表</strong>
                <span>{docs.length} 篇</span>
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
                  >
                    立即保存
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateDoc}
                    disabled={isCreating}
                  >
                    {isCreating ? "创建中..." : "新建"}
                  </button>
                </div>
              </div>
            </div>

            <div className="workspace-doc-list">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  className={`doc-item ${doc.id === activeDocId ? "is-active" : ""}`}
                  onClick={() => handleSelectDoc(doc.id)}
                >
                  <span className="doc-item-title">{doc.title.trim() || NEW_DOC_TITLE}</span>
                  <span className="doc-item-time">更新于 {formatTime(doc.updatedAt)}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="workspace-content">
            <div className="mobile-switch" aria-label="View mode switch">
              <button
                type="button"
                className={`btn ${mobilePane === "editor" ? "is-active" : ""}`}
                onClick={() => setMobilePane("editor")}
              >
                编辑
              </button>
              <button
                type="button"
                className={`btn ${mobilePane === "preview" ? "is-active" : ""}`}
                onClick={() => setMobilePane("preview")}
              >
                预览
              </button>
            </div>

            <section className={`editor-pane ${mobilePane === "editor" ? "is-visible" : ""}`}>
              <div className="pane-header">
                <span>Editor</span>
                <span>{activeDoc ? `${activeDoc.content.length} chars` : ""}</span>
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
                />
              </div>
            </section>

            <section className={`preview-pane ${mobilePane === "preview" ? "is-visible" : ""}`}>
              <div className="pane-header">
                <span>Preview</span>
                <span>{activeDoc ? formatTime(activeDoc.updatedAt) : ""}</span>
              </div>

              <div className="preview-body">
                {activeDoc?.content ? (
                  <article className="markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeDoc.content}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <p className="preview-empty">在左侧输入 Markdown，右侧会实时预览。</p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
