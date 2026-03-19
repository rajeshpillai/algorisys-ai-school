import type { ParentComponent } from 'solid-js';

const Sidebar: ParentComponent = (props) => {
  return (
    <>
      <aside class="sidebar">
        <nav class="sidebar-nav">
          {props.children}
        </nav>
      </aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: calc(100vh - var(--topbar-height));
          border-right: 1px solid var(--border-color);
          background: var(--bg-secondary);
          overflow-y: auto;
          position: sticky;
          top: var(--topbar-height);
        }

        .sidebar-nav {
          padding: 1rem;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
