import {
  Check,
  Code2,
  Copy,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { easeInOut, motion, AnimatePresence } from "motion/react";
import Editor from "@monaco-editor/react";

const Artifact = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState("code");
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { artifacts } = useSelector((state) => state.message);

  if (artifacts.length === 0) return null;

  const file = artifacts[0]?.files?.[activeFile];

  const htmlFile = artifacts[0]?.files?.find(
    (f) => f.name === "index.html"
  );

  const cssFile = artifacts[0]?.files?.find(
    (f) => f.name === "style.css"
  );

  const jsFile = artifacts[0]?.files?.find(
    (f) => f.name === "script.js"
  );

  const canPreview = Boolean(htmlFile);

  const previewDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <style>
          ${cssFile?.content || ""}
        </style>
      </head>

      <body>
        ${htmlFile?.content || ""}

        <script>
          ${jsFile?.content || ""}
        </script>
      </body>
    </html>
  `;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file?.content || "");

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const extension = file?.name?.split(".").pop()?.toLowerCase();

  const languageMap = {
    html: "html",
    css: "css",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
  };

  const PanelContent = ({ onClose }) => {
    return (
      <>
        {!collapsed ? (
          <div className="flex flex-col h-full bg-[#0d0f14]">
            {/* Header */}
            <div className="h-14 px-4 border-b border-white/5 flex items-center gap-3 shrink-0">
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg
                text-slate-500 hover:text-slate-200 hover:bg-white/5
                transition-colors duration-150 bg-transparent border-none
                cursor-pointer shrink-0"
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setCollapsed(true);
                  }
                }}
              >
                {onClose ? (
                  <X size={16} />
                ) : (
                  <PanelRightClose size={16} />
                )}
              </button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <Code2 className="text-indigo-400" size={12} />
                </div>

                <div className="text-[13px] font-medium text-slate-200 truncate">
                  {artifacts?.[0]?.title || "No Artifact"}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5
                  text-[11px] font-medium text-slate-400
                  hover:text-slate-200 hover:bg-white/5 rounded-lg
                  transition-colors duration-150 bg-transparent
                  border-none cursor-pointer"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>

              {canPreview && (
                <div className="flex items-center gap-1 bg-white/4 border border-white/6 p-1 rounded-lg">
                  <button
                    className={`flex items-center gap-1.5 px-2.5 py-1
                    text-[11px] font-medium rounded-md transition-colors
                    duration-150 ${
                      tab === "code"
                        ? "bg-indigo-500 text-white"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                    onClick={() => setTab("code")}
                  >
                    <Code2 size={11} />
                    Code
                  </button>

                  <button
                    className={`flex items-center gap-1.5 px-2.5 py-1
                    text-[11px] font-medium rounded-md transition-colors
                    duration-150 ${
                      tab === "preview"
                        ? "bg-indigo-500 text-white"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                    onClick={() => setTab("preview")}
                  >
                    <Eye size={11} />
                    Preview
                  </button>
                </div>
              )}
            </div>

            {/* Files */}
            {tab === "code" && (
              <div className="h-auto flex border-b border-white/6 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden shrink-0">
                {artifacts[0]?.files?.map((f, index) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFile(index)}
                    className={`px-4 py-2.5 text-[11px] font-medium
                    whitespace-nowrap transition-colors duration-150
                    border-r border-white/5 relative cursor-pointer
                    bg-transparent ${
                      activeFile === index
                        ? "text-indigo-400"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {f?.name}

                    {activeFile === index && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Editor / Preview */}
            <div className="flex-1 overflow-hidden">
              {tab === "preview" && canPreview ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  <iframe
                    title="preview"
                    srcDoc={previewDoc}
                    sandbox="allow-scripts"
                    className="w-full h-full bg-white"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={languageMap[extension] || "plaintext"}
                    value={file?.content || ""}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      padding: { top: 16 },
                      lineNumbers: "on",
                      renderLineHighlight: "none",
                    }}
                  />
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Desktop Panel */
          <div className="hidden lg:flex h-full border border-white/6 bg-[#0d0f14] flex-col items-center py-4 gap-3 shrink-0">
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg
              text-slate-500 hover:text-slate-200 hover:bg-white/5
              transition-colors duration-150 bg-transparent border-none
              cursor-pointer shrink-0"
              onClick={() => {
                setCollapsed(false);
              }}
            >
              <PanelRightOpen size={16} />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="text-[10px] font-medium text-slate-600
                tracking-widest uppercase whitespace-nowrap"
                style={{
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                }}
              >
                {artifacts?.[0]?.title || "No Artifact"}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Mobile View Code Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40
        flex items-center gap-2 px-3.5 py-2 rounded-xl
        bg-indigo-600 hover:bg-indigo-500 text-white
        text-[12px] font-medium shadow-lg shadow-indigo-500/20
        border-none cursor-pointer transition-colors duration-150"
      >
        <Code2 size={13} />
        View Code
      </button>

      {/* Mobile Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.25,
                ease: "easeInOut",
              }}
              className="lg:hidden fixed inset-y-0 right-0 z-50
              w-[88vw] max-w-105 border-l border-white/6
              overflow-hidden"
            >
              <PanelContent
                onClose={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      <motion.div
        initial={{ width: 400 }}
        animate={{ width: collapsed ? 48 : 400 }}
        transition={{
          duration: 0.25,
          ease: easeInOut,
        }}
        className="hidden lg:flex h-full border border-white/6
        flex-col overflow-hidden shrink-0"
      >
        <PanelContent />
      </motion.div>
    </>
  );
};

export default Artifact;