import React, { useMemo, useState, useEffect } from "react";

function getConfig() {
  const cfg = window.APP_CONFIG || {};
  return {
    background: {
      mode: cfg.background?.mode || "gradient",
      solid: cfg.background?.solid || "#0b1020",
      gradientFrom: cfg.background?.gradientFrom || "#0b1020",
      gradientTo: cfg.background?.gradientTo || "#1b3a6b",
      imageUrl: cfg.background?.imageUrl || ""
    },
    navLinks: Array.isArray(cfg.navLinks) ? cfg.navLinks : [
      { label: "Kubernetes Docs", url: "https://kubernetes.io/docs/" },
      { label: "GitHub", url: "https://github.com/" }
    ],
    textBox: {
      title: cfg.textBox?.title || "NOTES",
      placeholder: cfg.textBox?.placeholder || "Type something retro...",
      defaultText: cfg.textBox?.defaultText || "WELCOME, PLAYER ONE."
    }
  };
}

function normalizeUrl(u) {
  try { return new URL(u).toString(); } catch { return u; }
}

const STORAGE_KEY = "retro-webapp:textbox";

export default function App() {
  const initial = useMemo(() => getConfig(), []);

  // Background still comes from config at startup; keep your existing background behavior
  const [bgMode] = useState(initial.background.mode);
  const [bgSolid] = useState(initial.background.solid);
  const [bgFrom] = useState(initial.background.gradientFrom);
  const [bgTo] = useState(initial.background.gradientTo);
  const [bgImageUrl] = useState(initial.background.imageUrl);

  const [activeUrl, setActiveUrl] = useState(initial.navLinks[0]?.url || "");

  // Textbox: initialize from localStorage if present, else from config default
  const [text, setText] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved : initial.textBox.defaultText;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text);
  }, [text]);

  const backgroundStyle = useMemo(() => {
    if (bgMode === "solid") return { background: bgSolid };
    if (bgMode === "image" && bgImageUrl) {
      return {
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    }
    return { background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` };
  }, [bgMode, bgSolid, bgFrom, bgTo, bgImageUrl]);

  const resetText = () => {
    setText(initial.textBox.defaultText);
  };

  const clearText = () => {
    setText("");
  };

  return (
    <div className="layout" style={backgroundStyle}>
      <aside className="nav">
        <div className="navTop">
          <div className="brand">RETRO NAV</div>

          <nav className="navList">
            {initial.navLinks.map((l) => {
              const url = normalizeUrl(l.url);
              const isActive = normalizeUrl(activeUrl) === url;
              return (
                <a
                  key={url}
                  className={`navItem ${isActive ? "navItemActive" : ""}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={() => setActiveUrl(url)}
                  onFocus={() => setActiveUrl(url)}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom-left control pane */}
        <div className="navBottom">
          <div className="textBoxTitle">{initial.textBox.title}</div>

          <textarea
            className="textArea"
            value={text}
            placeholder={initial.textBox.placeholder}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="helperRow">
            <button className="smallBtn" type="button" onClick={resetText}>
              RESET
            </button>
            <button className="smallBtn" type="button" onClick={clearText}>
              CLEAR
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="card">
          <div className="h1">DISPLAY</div>
          <p className="p">
            This area reflects the text you enter in the sidebar textbox.
          </p>

          <div style={{ whiteSpace: "pre-wrap", fontSize: "10px", lineHeight: "1.9" }}>
            {text || "(empty)"}
          </div>
        </div>
      </main>
    </div>
  );
}
