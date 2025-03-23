"use client";

import { createContext, useContext, useState } from "react";

type TabType = "preview" | "config" | "files" | "artifacts";

interface TabContextType {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

const TabContext = createContext<TabContextType>({
  tab: "files",
  setTab: () => {},
});

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<TabType>("files");

  return (
    <TabContext.Provider value={{ tab, setTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  return useContext(TabContext);
}
