/** Authenticated app shell: sidebar + topbar with notifications and profile. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { navFor } from "../lib/nav";
import {
  ROUTE_PATH,
  useStore,
  type Route,
} from "../lib/store";
import { avatarClass, initials, relativeTime, roleClass } from "../lib/format";
import {
  IconBell,
  IconMenu,
  IconShield,
  IconX,
} from "./icons";

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: ReturnType<typeof navFor>[number]["items"][number];
  active: boolean;
  onNavigate: (r: Route) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`nav-item${active ? " is-active" : ""}`}
      onClick={() => onNavigate(item.route)}
      aria-current={active ? "page" : undefined}
    >
      <Icon />
      <span>{item.label}</span>
      {active && <span className="nav-dot" aria-hidden />}
    </button>
  );
}

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { session, route, navigate, signOut, notifications, markNotificationsRead } =
    useStore();
  const [drawer, setDrawer] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const groups = session ? navFor(session.role) : [];
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => setDrawer(false), [route]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (bellRef.current && !bellRef.current.contains(t)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(t))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!session) return null;

  const isActive = (r: Route) =>
    ROUTE_PATH[r.name] === ROUTE_PATH[route.name] &&
    (r.name !== "food-detail" || route.name === "food-detail");

  return (
    <div className="shell">
      {drawer && (
        <div className="backdrop" onClick={() => setDrawer(false)} />
      )}

      <aside className={`sidebar${drawer ? " is-open" : ""}`}>
        <div className="row row--between">
          <span className="brand" onClick={() => navigate({ name: session.role === "Manager" ? "manager-dashboard" : session.role === "Green Community" ? "gc-dashboard" : "user-dashboard" })} style={{ cursor: "pointer" }}>
            <span className="brand-mark">S</span>
            SmartSave
          </span>
          <button
            type="button"
            className="icon-button menu-toggle"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          >
            <IconX />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {groups.map((g) => (
            <div className="nav-group" key={g.eyebrow}>
              <span className="eyebrow">{g.eyebrow}</span>
              {g.items.map((item) => (
                <NavButton
                  key={item.label}
                  item={item}
                  active={isActive(item.route)}
                  onNavigate={(r) => {
                    navigate(r);
                    setDrawer(false);
                  }}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-meta">
          <span className={`role-chip ${roleClass(session.role)}`}>
            <IconShield style={{ width: 13, height: 13 }} />
            {session.role}
          </span>
          <span className="tiny">
            Prototype session · no production authentication
          </span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <button
              type="button"
              className="icon-button menu-toggle"
              aria-label="Open menu"
              onClick={() => setDrawer(true)}
              style={{ marginRight: 4 }}
            >
              <IconMenu />
            </button>
            <span>SmartSave</span>
            <span aria-hidden>/</span>
            <span>
              <strong>{title}</strong>
            </span>
          </div>

          <div className="topbar-right">
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                className="icon-button"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                onClick={() => {
                  setBellOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <IconBell />
                {unread > 0 && <span className="icon-dot" />}
              </button>
              {bellOpen && (
                <div className="popover">
                  <div className="popover-title">Website notifications</div>
                  {notifications.length === 0 ? (
                    <div className="popover-empty">No notifications yet.</div>
                  ) : (
                    <>
                      {notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className="popover-item"
                          onClick={() => {
                            setBellOpen(false);
                            navigate({ name: "expiry-notifications" });
                          }}
                        >
                          <strong>
                            {n.title}
                            {!n.read && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: "var(--red)",
                                  marginLeft: 6,
                                  verticalAlign: "middle",
                                }}
                              />
                            )}
                          </strong>
                          <span>
                            {n.body} · {relativeTime(n.createdAt)}
                          </span>
                        </button>
                      ))}
                      <div className="popover-sep" />
                      <div className="popover-empty" style={{ padding: "8px 0 0" }}>
                        In-website notifications only — no email or push is
                        configured in this prototype.
                      </div>
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        style={{ width: "100%", marginTop: 8 }}
                        onClick={() => {
                          markNotificationsRead();
                          setBellOpen(false);
                        }}
                      >
                        Mark all as read
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setBellOpen(false);
                }}
              >
                <span className={`avatar ${avatarClass(session.role)}`}>
                  {initials(session.name)}
                </span>
                <span className="profile-name">{session.name}</span>
              </button>
              {profileOpen && (
                <div className="popover" style={{ width: 250 }}>
                  <div className="popover-title">{session.role}</div>
                  <div className="popover-item" style={{ cursor: "default" }}>
                    <strong>{session.name}</strong>
                    <span>{session.role} access</span>
                  </div>
                  <div className="popover-sep" />
                  <button
                    type="button"
                    className="popover-item"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate({ name: "profile" });
                    }}
                  >
                    <strong>Profile / Account Settings</strong>
                    <span>Details and password</span>
                  </button>
                  <button
                    type="button"
                    className="popover-item"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                  >
                    <strong>Sign out</strong>
                    <span>End this prototype session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page reveal" key={String(route.name)}>
          {children}
        </main>
      </div>
    </div>
  );
}
