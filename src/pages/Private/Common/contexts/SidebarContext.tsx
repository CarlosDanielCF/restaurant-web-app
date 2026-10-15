import { FC, useState, createContext } from 'react';

export type SidebarContext = {
  sidebarToggle: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const SidebarContext = createContext<SidebarContext>(
  {} as SidebarContext
);

interface Props {
  children: JSX.Element | JSX.Element[];
}

const SIDEBAR_STATE_KEY = 'sidebar-toggle-state';
const SIDEBAR_COLLAPSED_KEY = 'sidebar-desktop-collapsed';

export const SidebarProvider: FC<Props> = ({ children }) => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  const toggleSidebar = () => {
    const newState = !sidebarToggle;
    setSidebarToggle(newState);
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
  };

  const closeSidebar = () => {
    setSidebarToggle(false);
    localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
  };

  const openSidebar = () => {
    setSidebarToggle(true);
    localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(val));
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarToggle,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        isCollapsed,
        toggleCollapse,
        setCollapsed
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

