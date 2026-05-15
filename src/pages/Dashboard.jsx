import React, { useMemo, useState } from 'react';
import { Eye, Plus, Pencil, Trash2, Copy, Loader2, Download } from 'lucide-react';
import { useNewsletterStorage } from '@/hooks/useNewsletterStorage';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router-shim';
import NewsletterRenderer from '@/components/NewsletterRenderer';
import NewsletterThumbnail from '@/components/NewsletterThumbnail';
import { base44 } from '@/api/base44Client';
import legacyNewsletters from '@/data/legacy-newsletters.json';

const Newsletter = base44.entities.Newsletter;

export default function Dashboard() {
  const { user } = useAuth();
  const { newsletters, loading, deleteNewsletter, refetch } = useNewsletterStorage(user?.id);
  const [previewing, setPreviewing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  // How many of the legacy newsletters are not yet imported here?
  // We dedupe by the original Supabase id stored in state._legacy.newsletter_id.
  const importedLegacyIds = useMemo(() => {
    const ids = new Set();
    for (const n of newsletters) {
      const id = n.data?._legacy?.newsletter_id;
      if (id) ids.add(id);
    }
    return ids;
  }, [newsletters]);

  const pendingLegacy = useMemo(
    () => legacyNewsletters.filter((l) => !importedLegacyIds.has(l._legacy_id)),
    [importedLegacyIds]
  );

  const onImportLegacy = async () => {
    if (!pendingLegacy.length) return;
    setImportStatus({ phase: 'running', done: 0, total: pendingLegacy.length });
    let done = 0;
    let failed = 0;
    for (const item of pendingLegacy) {
      try {
        await Newsletter.create({
          name: item.name,
          description: item.description,
          state: item.state,
          is_template: !!item.is_template,
          ...(item.thumbnail_url ? { thumbnail_url: item.thumbnail_url } : {}),
        });
        done++;
      } catch (err) {
        console.error('Legacy import failed for', item.name, err);
        failed++;
      }
      setImportStatus({ phase: 'running', done, total: pendingLegacy.length, failed });
    }
    setImportStatus({ phase: 'done', done, total: pendingLegacy.length, failed });
    await refetch();
  };

  const onCreate = () => navigate('/editor/new');
  const onEdit = (id) => navigate(`/editor/${id}`);

  const onDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setBusy(true);
    try {
      await deleteNewsletter(id);
    } finally {
      setBusy(false);
    }
  };

  const onDuplicate = async (row) => {
    setBusy(true);
    try {
      const full = await Newsletter.get(row.id);
      await Newsletter.create({
        name: `${full.name} (Copy)`,
        description: full.description ?? '',
        state: full.state ?? {},
      });
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  if (previewing) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: '#0F172A' }}>
        <header style={topbar()}>
          <button onClick={() => setPreviewing(null)} style={btnGhost()}>
            ← Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Preview: {previewing.name}</span>
        </header>
        <div style={{ padding: '24px 0' }}>
          <NewsletterRenderer newsletter={previewing.data} />
        </div>
      </div>
    );
  }

  return (
    <div style={page()}>
      <div style={{ width: '100%', maxWidth: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
              Newsletter Studio
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              on Base44 · {newsletters.length} {newsletters.length === 1 ? 'newsletter' : 'newsletters'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pendingLegacy.length > 0 && (
              <button
                onClick={onImportLegacy}
                disabled={busy || importStatus?.phase === 'running'}
                style={btnGhost(true)}
                title={`Import ${pendingLegacy.length} newsletters from the old Supabase database`}
              >
                {importStatus?.phase === 'running' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing {importStatus.done}/{importStatus.total}…
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Import {pendingLegacy.length} legacy
                  </>
                )}
              </button>
            )}
            <button onClick={refetch} disabled={loading || busy} style={btnGhost(true)}>
              Refresh
            </button>
            <button onClick={onCreate} style={btnPrimary()}>
              <Plus size={14} /> New newsletter
            </button>
          </div>
        </div>

        {importStatus?.phase === 'done' && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--accent-soft)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--text-2)',
            }}
          >
            Imported {importStatus.done} legacy newsletters from Supabase
            {importStatus.failed ? ` (${importStatus.failed} failed)` : ''}.
            <button
              onClick={() => setImportStatus(null)}
              style={{
                marginLeft: 8,
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div
              style={{
                padding: 48,
                color: 'var(--text-3)',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : newsletters.length === 0 ? (
            <div style={emptyCard()}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                No newsletters yet
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>
                Click <strong>New newsletter</strong> to create your first one.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 18,
              }}
            >
              {newsletters.map((n) => (
                <article key={n.id} style={card()} className="media-card">
                  <button
                    onClick={() => onEdit(n.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'block',
                      width: '100%',
                    }}
                    title="Open in editor"
                  >
                    <NewsletterThumbnail newsletter={n.data} width={360} height={200} />
                  </button>

                  <div style={{ padding: '12px 14px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--text-1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                        title={n.name}
                      >
                        {n.name}
                      </div>
                      {n.data?._legacy?.author_email && (
                        <span style={authorBadge(n.data._legacy.author_email)}>
                          {shortAuthor(n.data._legacy.author_email)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginTop: 3,
                      }}
                    >
                      {(n.data?.sections ?? []).length} sections
                      {n.updatedAt
                        ? ` · ${new Date(n.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}`
                        : ''}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      padding: '4px 10px 10px',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button onClick={() => onEdit(n.id)} style={iconBtn()} title="Edit">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => setPreviewing(n)} style={iconBtnGhost()} title="Preview">
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => onDuplicate(n)}
                      disabled={busy}
                      style={iconBtnGhost()}
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(n.id, n.name)}
                      disabled={busy}
                      style={iconBtnDanger()}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function page() {
  return {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    background: 'transparent',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
    padding: '14px 12px 20px',
    color: 'var(--text-1)',
  };
}

function topbar() {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    background: '#0B1220',
    color: '#fff',
    borderBottom: '1px solid #1E293B',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
  };
}

function card() {
  return {
    background: 'var(--glass-strong)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--glass-border)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-rest)',
    display: 'flex',
    flexDirection: 'column',
  };
}

function emptyCard() {
  return {
    padding: 32,
    background: 'var(--glass-strong)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: 14,
    border: '1px dashed rgba(0,0,0,0.12)',
  };
}

function btnPrimary() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    border: '1px solid var(--accent)',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  };
}

function btnGhost(small = false) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: small ? '7px 12px' : '8px 14px',
    border: '1px solid var(--control-border)',
    background: '#fff',
    color: 'var(--text-2)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  };
}

function iconBtn() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    border: '1px solid var(--control-border)',
    background: '#fff',
    color: 'var(--text-1)',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    flex: 1,
    justifyContent: 'center',
  };
}

function iconBtnGhost() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-3)',
    borderRadius: 7,
    cursor: 'pointer',
  };
}

function iconBtnDanger() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#dc2626',
    borderRadius: 7,
    cursor: 'pointer',
  };
}

const AUTHOR_COLORS = {
  'tuvitk@wix.com':         { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' },
  'yanivorion88@gmail.com': { bg: '#DBEAFE', fg: '#1E40AF', border: '#BFDBFE' },
  'yaniv@studio.local':     { bg: '#E0E7FF', fg: '#4338CA', border: '#C7D2FE' },
  'maytala@wix.com':        { bg: '#FCE7F3', fg: '#9D174D', border: '#FBCFE8' },
};

function authorBadge(email) {
  const c = AUTHOR_COLORS[email] || { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' };
  return {
    display: 'inline-block',
    padding: '2px 7px',
    background: c.bg,
    color: c.fg,
    border: `1px solid ${c.border}`,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.02em',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };
}

function shortAuthor(email) {
  if (email === 'tuvitk@wix.com') return 'Tuvit';
  if (email === 'yanivorion88@gmail.com') return 'Yaniv (old)';
  if (email === 'yaniv@studio.local') return 'Yaniv (local)';
  if (email === 'maytala@wix.com') return 'Maytal';
  return email.split('@')[0];
}
