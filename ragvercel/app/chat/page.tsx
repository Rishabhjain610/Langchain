"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Trash2,
  Upload,
  BookOpen,
  Brain,
  Plus,
  FileText,
  Loader2,
  Database,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";

const SourcesContainer = ({ annotations }: { annotations: any[] }) => {
  const sourcesAnnotation = annotations.find((a: any) => a.type === "sources");
  const sources = sourcesAnnotation?.sources;

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <Sources>
        <SourcesTrigger count={sources.length} />
        <SourcesContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {sources.map((src: any, index: number) => (
              <Source key={index} href="#">
                <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 transition-all text-xs text-left cursor-default w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {src.title}
                    </span>
                    <span className="text-[10px] text-primary bg-primary-foreground/10 px-1.5 py-0.5 rounded font-mono shrink-0 border border-primary/10">
                      {(src.similarity * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground leading-normal">
                    {src.content}
                  </p>
                </div>
              </Source>
            ))}
          </div>
        </SourcesContent>
      </Sources>
    </div>
  );
};

export default function ChatPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Manual Note State
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vercel AI SDK hook
  const { messages, input, handleInputChange, handleSubmit, status, stop, reload } =
    useChat({
      api: "/api/chat",
      sendExtraMessageFields: true,
    });

  // Fetch index document list
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the search index?`)) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete document");
      }
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    setUploadError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Limit to 2MB text files
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Max size is 2MB.`);
        }

        const text = await file.text();
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, content: text }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Failed to index ${file.name}`);
        }
      }

      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;

    setUploading(true);
    setUploadError("");
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: manualTitle, content: manualContent }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to index document");
      }
      setManualTitle("");
      setManualContent("");
      setModalOpen(false);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || "Failed to index document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background">
      {/* Left Pane - Document Management */}
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border flex flex-col h-[45vh] md:h-full bg-card/40 backdrop-blur-md shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Database className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none">Knowledge Index</h2>
              <span className="text-[10px] text-muted-foreground">Local Vector Database</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={fetchDocuments}
            disabled={loadingDocs}
            title="Refresh list"
          >
            <RefreshCw className={`size-3.5 ${loadingDocs ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Scrollable sidebar contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0">
          {/* File Upload Area */}
          <div
            className={`relative rounded-xl border border-dashed p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px] ${
              dragActive
                ? "border-primary bg-primary/5 scale-[0.98]"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/10"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept=".txt,.md,.json,.csv,.js,.ts"
            />
            {uploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Chunking & embedding...</span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-muted">
                  <Upload className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">Upload text or markdown files</p>
                  <p className="text-[10px] text-muted-foreground">Drag & drop or click to browse</p>
                </div>
              </>
            )}
          </div>

          {/* Quick Add Dialog */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs">
                <Plus className="size-3.5" />
                Paste Custom Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    Index Custom Text
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Directly type or paste document content to make it available to the chatbot.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Document Title</label>
                    <Input
                      placeholder="e.g. Employee Handbook, Project Guidelines"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      required
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Content</label>
                    <Textarea
                      placeholder="Paste instructions, code snippets, or texts here..."
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      required
                      className="text-xs min-h-[140px] resize-none"
                    />
                  </div>
                </div>

                <DialogFooter className="flex-row justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Indexing...
                      </>
                    ) : (
                      "Add to Index"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {uploadError && (
            <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-[11px] text-destructive flex items-start gap-1.5">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Document List */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Uploaded Documents ({documents.length})
            </h3>
            
            {loadingDocs ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-1 border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60 min-h-[120px]">
                <BookOpen className="size-5 mb-2 text-muted-foreground/40" />
                <p className="text-[11px] font-medium leading-none">No documents indexed</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Upload a file or note to begin.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[180px] md:max-h-none">
                {documents.map((doc) => (
                  <Card key={doc.id} size="sm" className="group border border-border/60 hover:border-border transition-all">
                    <CardHeader className="p-2.5 flex flex-row items-center justify-between gap-2 space-y-0">
                      <div className="min-w-0 flex-1 flex items-start gap-2">
                        <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <CardTitle className="text-xs font-semibold truncate text-foreground pr-1" title={doc.name}>
                            {doc.name}
                          </CardTitle>
                          <CardDescription className="text-[10px] flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{doc.chunkCount} {doc.chunkCount === 1 ? "chunk" : "chunks"}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 rounded transition-all shrink-0"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                        title="Delete document"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Pane - Chatbot Area */}
      <main className="flex-1 flex flex-col h-[55vh] md:h-full bg-background relative">
        {/* Chat Header */}
        <header className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Brain className="size-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none">RAG Chatbot</h1>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>Ollama: qwen3:8b</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-500">Connected</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground border border-border/40 font-medium">
              {documents.length} Docs Indexed
            </span>
          </div>
        </header>

        {/* Scrollable Conversation */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <Conversation className="h-full flex-1">
            <ConversationContent className="max-w-3xl mx-auto w-full py-6 flex flex-col gap-6">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-10 text-muted-foreground/30" />}
                  title="Retrieval-Augmented Chatbot"
                  description="Ask any question. The assistant will search through your uploaded knowledge documents to answer."
                >
                  <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    <div className="border border-border/80 rounded-xl p-3.5 bg-card/30 text-left space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Upload className="size-3.5 text-primary" />
                        1. Index Documents
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Upload TXT/MD files or paste text notes to build your index.
                      </p>
                    </div>
                    <div className="border border-border/80 rounded-xl p-3.5 bg-card/30 text-left space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Sparkles className="size-3.5 text-primary" />
                        2. Query the LLM
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Ask questions. We use cosine similarity and local models to reply.
                      </p>
                    </div>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent className="px-4 py-3.5 max-w-[85%]">
                      {message.role === "user" ? (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.content}</div>
                      ) : (
                        <div className="space-y-3 prose dark:prose-invert max-w-none text-sm leading-relaxed">
                          <MessageResponse>{message.content}</MessageResponse>
                        </div>
                      )}

                      {message.role === "assistant" && message.annotations && (
                        <SourcesContainer annotations={message.annotations} />
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Input Form Footer */}
        <footer className="p-4 border-t border-border bg-background shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            <PromptInput
              onSubmit={async (msg, e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              <PromptInputBody className="relative flex flex-col rounded-xl border border-input bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all">
                <PromptInputTextarea
                  placeholder={
                    documents.length === 0
                      ? "Index a document in the sidebar to search..."
                      : "Ask something about your indexed documents..."
                  }
                  value={input}
                  onChange={handleInputChange}
                  className="min-h-[50px] max-h-[120px] w-full border-0 bg-transparent p-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none resize-none field-sizing-content"
                />
                <PromptInputFooter className="flex items-center justify-between border-t border-border/40 p-2 bg-muted/20">
                  <PromptInputTools className="flex gap-1">
                    <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                      <Database className="size-2.5 text-primary" />
                      RAG Active
                    </span>
                  </PromptInputTools>
                  <PromptInputSubmit status={status} onStop={stop} />
                </PromptInputFooter>
              </PromptInputBody>
            </PromptInput>
          </div>
        </footer>
      </main>
    </div>
  );
}