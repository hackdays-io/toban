// Toban primitives
const { useState, useEffect, useRef, useMemo, createContext, useContext, Fragment } = React;
const T = window.TOBAN;

// ─── icons ─────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', stroke = 1.7 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3.5 11L12 4l8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-3v-6h-8v6H5A1.5 1.5 0 0 1 3.5 20z"/></svg>;
    case 'duty': return <svg {...p}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="18" cy="6" r="2.5"/></svg>;
    case 'split': return <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v8.5l6 6"/></svg>;
    case 'members': return <svg {...p}><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.8"/><path d="M3 19c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5"/><path d="M15 17c.6-2 2-3 3.5-3 2 0 3.5 1.5 3.5 3.5"/></svg>;
    case 'wallet': return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18"/><circle cx="17" cy="14" r="1.3" fill={color}/></svg>;
    case 'bell': return <svg {...p}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2H4.5z"/><path d="M10 21h4"/></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'edit': return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>;
    case 'gear': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>;
    case 'send': return <svg {...p}><path d="M21 3L3 11l7 2 2 7z"/><path d="M21 3l-11 11"/></svg>;
    case 'check': return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
    case 'chevron-right': return <svg {...p}><path d="M9 5l7 7-7 7"/></svg>;
    case 'chevron-left': return <svg {...p}><path d="M15 5l-7 7 7 7"/></svg>;
    case 'chevron-down': return <svg {...p}><path d="M5 9l7 7 7-7"/></svg>;
    case 'close': return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'arrow-right': return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>;
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/></svg>;
    case 'user': return <svg {...p}><circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>;
    case 'invite': return <svg {...p}><circle cx="9" cy="9" r="3.5"/><path d="M3 19c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5"/><path d="M18 8v6M15 11h6"/></svg>;
    case 'copy': return <svg {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>;
    case 'logout': return <svg {...p}><path d="M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5"/><path d="M10 16l-4-4 4-4"/><path d="M16 12H6"/></svg>;
    case 'qr': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7M14 21h3"/></svg>;
    case 'pie': return <svg {...p}><path d="M12 3v9l8 4a9 9 0 1 1-8-13z"/></svg>;
    default: return null;
  }
};

// ─── status badge ─────────────────────────────────────────────
const Badge = ({ kind = 'member', children, style = {} }) => {
  const palette = {
    member: { bg: '#E5F5EC', fg: '#2F8B58' },
    lead: { bg: T.color.primarySoft, fg: '#A07310' },
    supporter: { bg: '#E8E2D4', fg: '#7A5A2E' },
    role: { bg: '#F2EAD9', fg: '#7A5A2E' },
    danger: { bg: '#FBE5E2', fg: '#B5382C' },
    info: { bg: '#E2F0FB', fg: '#2870A8' },
  };
  const p = palette[kind] || palette.member;
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: T.radius.full,
    background: p.bg, color: p.fg, fontSize: 12, fontWeight: 600,
    ...style,
  }}>{children}</span>;
};

// ─── button ───────────────────────────────────────────────────
const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, full, icon, style = {} }) => {
  const sizes = { sm: { h: 36, fs: 14, px: 14 }, md: { h: 48, fs: 15, px: 20 }, lg: { h: 56, fs: 16, px: 24 } };
  const s = sizes[size];
  const base = {
    height: s.h, padding: `0 ${s.px}px`, borderRadius: T.radius.full,
    fontSize: s.fs, fontWeight: 600, fontFamily: T.font,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    width: full ? '100%' : undefined,
    transition: 'all .15s ease', userSelect: 'none',
  };
  const variants = {
    primary: { background: disabled ? '#F0E7CB' : T.color.primary, color: disabled ? '#B0A179' : T.color.textPrimary, boxShadow: disabled ? 'none' : '0 1px 0 rgba(0,0,0,0.04)' },
    soft: { background: T.color.primarySoft, color: '#7A5A2E' },
    secondary: { background: T.color.surface, color: T.color.textPrimary, border: `1px solid ${T.color.border}` },
    ghost: { background: 'transparent', color: T.color.textSecondary },
    danger: { background: T.color.surface, color: T.color.danger, border: `1px solid ${T.color.border}` },
    dark: { background: T.color.textPrimary, color: '#fff' },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
};

// ─── card ─────────────────────────────────────────────────────
const Card = ({ children, style = {}, padding = 16, onClick, accent }) => (
  <div onClick={onClick} style={{
    background: T.color.surface,
    borderRadius: T.radius.md,
    border: `1px solid ${T.color.border}`,
    boxShadow: T.shadow[1],
    padding,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform .15s ease',
    position: 'relative', overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

// ─── avatar ──────────────────────────────────────────────────
const palettes = ['#F5B82E', '#65C98A', '#5DADEC', '#D6B995', '#E48F4F', '#B696E0', '#E48ABF'];
function avatarColor(seed = '') {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palettes[h % palettes.length];
}
const Avatar = ({ name = '?', size = 36, src }) => {
  const initials = name.replace(/[^a-zA-Z\u3040-\u30ff\u4e00-\u9fff]/g, '').slice(0, 2).toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: T.radius.full,
      background: avatarColor(name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.42, flex: 'none',
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
      letterSpacing: -0.5,
    }}>{!src && initials}</div>
  );
};

// ─── input ────────────────────────────────────────────────────
const Input = ({ icon, value, onChange, placeholder, type = 'text', style = {}, multiline, rows = 3 }) => {
  const wrap = {
    display: 'flex', alignItems: multiline ? 'flex-start' : 'center', gap: 8,
    padding: multiline ? '12px 14px' : '0 14px',
    height: multiline ? undefined : 48,
    background: T.color.surface,
    border: `1px solid ${T.color.border}`,
    borderRadius: T.radius.sm,
    fontFamily: T.font,
    ...style,
  };
  const inputStyle = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontSize: 15, fontFamily: T.font, color: T.color.textPrimary,
    width: '100%', padding: 0, resize: 'none',
  };
  return (
    <div style={wrap}>
      {icon && <Icon name={icon} size={18} color={T.color.textSecondary} />}
      {multiline
        ? <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows} style={inputStyle} />
        : <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} style={inputStyle} />}
    </div>
  );
};

// ─── chip / segmented ────────────────────────────────────────
const Chip = ({ children, active, onClick, icon }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 34, padding: '0 14px', borderRadius: T.radius.full,
    background: active ? T.color.textPrimary : T.color.surface,
    color: active ? '#fff' : T.color.textPrimary,
    border: `1px solid ${active ? T.color.textPrimary : T.color.border}`,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
    whiteSpace: 'nowrap',
  }}>
    {icon && <Icon name={icon} size={14} />}
    {children}
  </button>
);

const Segmented = ({ options, value, onChange }) => (
  <div style={{
    display: 'flex', padding: 4, background: '#F0EBE0',
    borderRadius: T.radius.full, gap: 2,
  }}>
    {options.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)} style={{
        flex: 1, height: 36, border: 'none',
        background: value === opt.value ? T.color.surface : 'transparent',
        borderRadius: T.radius.full,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        color: value === opt.value ? T.color.textPrimary : T.color.textSecondary,
        boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        fontFamily: T.font,
      }}>{opt.label}</button>
    ))}
  </div>
);

// ─── list row ────────────────────────────────────────────────
const Row = ({ left, title, subtitle, right, onClick, style = {} }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>
    {left}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.color.textPrimary, lineHeight: 1.3 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// ─── divider ─────────────────────────────────────────────────
const Divider = ({ inset = 0 }) => (
  <div style={{ height: 1, background: T.color.border, marginLeft: inset }} />
);

// ─── header ──────────────────────────────────────────────────
const ScreenHeader = ({ title, onBack, right, subtitle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px 12px',
    background: T.color.bg, borderBottom: `1px solid transparent`,
  }}>
    {onBack && (
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: T.radius.full,
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="chevron-left" size={22} /></button>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.color.textPrimary }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 2 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// ─── bottom nav ──────────────────────────────────────────────
const BottomNav = ({ active, onChange }) => {
  const items = [
    { key: 'home', label: 'ホーム', icon: 'home' },
    { key: 'duties', label: '当番', icon: 'duty' },
    { key: 'splits', label: '分配', icon: 'split' },
    { key: 'members', label: 'メンバー', icon: 'members' },
    { key: 'wallet', label: 'ウォレット', icon: 'wallet' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 8px 22px',
      background: T.color.surface,
      borderTop: `1px solid ${T.color.border}`,
    }}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 8px', flex: 1,
            color: isActive ? T.color.primary : T.color.textSecondary,
            fontFamily: T.font,
          }}>
            <div style={{
              width: 44, height: 28, borderRadius: T.radius.full,
              background: isActive ? T.color.primarySoft : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}>
              <Icon name={it.icon} size={20} color={isActive ? '#A07310' : T.color.textSecondary} stroke={isActive ? 2 : 1.7} />
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── modal / sheet ──────────────────────────────────────────
const Sheet = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: T.color.overlay,
      animation: 'tobanFade .18s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.color.surface,
        borderTopLeftRadius: T.radius.lg, borderTopRightRadius: T.radius.lg,
        padding: '8px 0 28px',
        animation: 'tobanSlide .22s ease',
        maxHeight: '88%', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: T.color.border, borderRadius: 2 }} />
        </div>
        {title && <div style={{ padding: '8px 20px 12px', fontSize: 17, fontWeight: 700 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
};

// ─── toast ──────────────────────────────────────────────────
const Toast = ({ children, show }) => (
  <div style={{
    position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 200,
    background: T.color.textPrimary, color: '#fff',
    borderRadius: T.radius.full, padding: '12px 18px',
    fontSize: 13, fontWeight: 600, textAlign: 'center',
    transform: show ? 'translateY(0)' : 'translateY(20px)',
    opacity: show ? 1 : 0,
    transition: 'all .25s ease',
    pointerEvents: 'none',
    boxShadow: T.shadow[3],
  }}>{children}</div>
);

// ─── empty state ─────────────────────────────────────────────
const EmptyState = ({ icon, title, body, action }) => (
  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
    <div style={{
      width: 56, height: 56, borderRadius: T.radius.full,
      background: T.color.primarySoft, margin: '0 auto 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}><Icon name={icon} size={26} color="#A07310" /></div>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.color.textPrimary, marginBottom: 6 }}>{title}</div>
    {body && <div style={{ fontSize: 13, color: T.color.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>{body}</div>}
    {action}
  </div>
);

// expose
Object.assign(window, {
  Icon, Badge, Button, Card, Avatar, Input, Chip, Segmented, Row, Divider,
  ScreenHeader, BottomNav, Sheet, Toast, EmptyState,
});
