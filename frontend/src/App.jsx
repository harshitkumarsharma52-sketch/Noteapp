import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:3000/notes";

const readPref = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const savePref = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function App() {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [toast, setToast] = useState("");

  // composer
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  // card states
  const [removingId, setRemovingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // toolbar
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => readPref("notes-view", "grid"));
  const [theme, setTheme] = useState(() => readPref("notes-theme", "dark"));

  const formRef = useRef(null);
  const toastTimer = useRef(null);

  /* ---------- theme ---------- */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    savePref("notes-theme", theme);
  }, [theme]);

  useEffect(() => savePref("notes-view", view), [view]);

  /* ---------- helpers ---------- */
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- Read ---------- */
  async function fetchNotes() {
    try {
      const res = await axios.get(API);
      setNotes(res.data.notes || []);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  /* ---------- Create ---------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await axios.post(API, { title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      setOpen(false);
      fetchNotes();
    } catch (err) {
      console.error(err);
      showToast("Note save nahi hua. Dobara try karo.");
    }
  }

  function onComposerBlur(e) {
    // focus form ke bahar gaya aur kuch likha nahi: form ko chhota kar do
    if (!e.currentTarget.contains(e.relatedTarget) && !title.trim() && !content.trim()) {
      setOpen(false);
    }
  }

  function onComposerKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      formRef.current?.requestSubmit();
    }
    if (e.key === "Escape" && !title.trim() && !content.trim()) {
      setOpen(false);
      e.target.blur();
    }
  }

  /* ---------- Delete (pehle exit animation, phir API call) ---------- */
  function handleDelete(id) {
    setRemovingId(id);
    setTimeout(async () => {
      try {
        await axios.delete(`${API}/${id}`);
        fetchNotes();
      } catch (err) {
        console.error(err);
        showToast("Note delete nahi hua.");
      } finally {
        setRemovingId(null);
      }
    }, 380);
  }

  /* ---------- Update (PATCH) ---------- */
  function startEdit(note) {
    setEditingId(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id) {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await axios.patch(`${API}/${id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setEditingId(null);
      fetchNotes();
    } catch (err) {
      console.error(err);
      showToast("Update nahi hua.");
    }
  }

  /* ---------- Spotlight effect ---------- */
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  /* ---------- Search ---------- */
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      !q
        ? notes
        : notes.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.content.toLowerCase().includes(q)
          ),
    [notes, q]
  );

  const subtitle =
    status === "ready"
      ? q
        ? `${visible.length} of ${notes.length} notes`
        : `${notes.length} ${notes.length === 1 ? "note" : "notes"} saved`
      : "Loading your notes...";

  return (
    <div className="app">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <main className="container">
        <header className="header">
          <span className="badge">✦ Notes App</span>
          <h1>
            Think it. <span className="gradient-text">Write it.</span>
          </h1>
          <p className="subtitle">{subtitle}</p>
        </header>

        {/* ---------- Composer ---------- */}
        <form
          ref={formRef}
          className={`composer${open ? " open" : ""}`}
          onSubmit={handleSubmit}
          onBlur={onComposerBlur}
          onKeyDown={onComposerKey}
        >
          <input
            className="composer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={60}
            aria-label="Note title"
            tabIndex={open ? 0 : -1}
          />
          <textarea
            className="composer-body"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Take a note..."
            rows={open ? 4 : 1}
            aria-label="Note content"
          />
          <div className="composer-footer">
            <span className="counter">
              {content.length} characters · Ctrl+Enter to save
            </span>
            <button type="submit" disabled={!title.trim() || !content.trim()}>
              <span>Add Note</span>
            </button>
          </div>
        </form>

        {/* ---------- Toolbar ---------- */}
        <div className="toolbar" role="toolbar" aria-label="Notes tools">
          <label className="search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <div className="seg" role="group" aria-label="Layout">
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              aria-label="List view"
              title="List view"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title="Theme"
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>

        {/* ---------- Content ---------- */}
        {status === "loading" && (
          <section className="notes-grid" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`skeleton s${n % 3}`} />
            ))}
          </section>
        )}

        {status === "error" && (
          <div className="empty" role="alert">
            <div className="empty-icon">⚠️</div>
            <h3>Notes load nahi hue</h3>
            <p>Backend chal raha hai ya nahi check karo.</p>
            <button
              type="button"
              className="retry-btn"
              onClick={() => {
                setStatus("loading");
                fetchNotes();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && notes.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📝</div>
            <h3>Abhi koi note nahi hai</h3>
            <p>Upar se apna pehla note likho.</p>
          </div>
        )}

        {status === "ready" && notes.length > 0 && visible.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <h3>Kuch nahi mila</h3>
            <p>“{query}” se koi note match nahi hua.</p>
          </div>
        )}

        {status === "ready" && visible.length > 0 && (
          <section className={`notes-grid${view === "list" ? " list" : ""}`}>
            {visible.map((note, i) => (
              <article
                key={note._id}
                className={`note-card${removingId === note._id ? " removing" : ""}${
                  editingId === note._id ? " editing" : ""
                }`}
                style={{ "--i": i, "--hue": (i * 47 + 255) % 360 }}
                onMouseMove={handleMouseMove}
              >
                {editingId === note._id ? (
                  <>
                    <input
                      className="edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={60}
                      aria-label="Edit title"
                      autoFocus
                    />
                    <textarea
                      className="edit-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      aria-label="Edit content"
                    />
                    <div className="card-actions always">
                      <button
                        className="save-btn"
                        onClick={() => handleUpdate(note._id)}
                        disabled={!editTitle.trim() || !editContent.trim()}
                      >
                        Save
                      </button>
                      <button className="cancel-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{note.title}</h3>
                    <p>{note.content}</p>
                    <div className="card-footer">
                      <span className="card-date">{formatDate(note.createdAt)}</span>
                      <div className="card-actions">
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(note)}
                          aria-label={`Edit ${note.title}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(note._id)}
                          aria-label={`Delete ${note.title}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </section>
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
