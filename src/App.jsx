import React, { useMemo, useState } from "react";

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
    centerBox: {
      title: cfg.centerBox?.title || "RETROPLAY",
      text: cfg.centerBox?.text || "WELCOME, PLAYER ONE.",
      subtext: cfg.centerBox?.subtext || ""
    }
  };
}

function normalizeUrl(u) {
  try { return new URL(u).toString(); } catch { return u; }
}

export default function App() {
  const initial = useMemo(() => getConfig(), []);

  const [activeUrl, setActiveUrl] = useState(initial.navLinks[0]?.url || "");

  const backgroundStyle = useMemo(() => {
    const b = initial.background;
    if (b.mode === "solid") return { background: b.solid };
    if (b.mode === "image" && b.imageUrl) {
      return {
        backgroundImage: `url(${b.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    }
    return { background: `linear-gradient(135deg, ${b.gradientFrom}, ${b.gradientTo})` };
  }, [initial.background]);

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
      </aside>

      <main className="main mainCenter">
        <div className="centerBox">
          <div className="centerTitle">{initial.centerBox.title}</div>
          <div className="centerText">{initial.centerBox.text}</div>
          {initial.centerBox.subtext ? (
            <div className="centerSubtext">{initial.centerBox.subtext}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
