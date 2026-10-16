import React from "react";

interface PageTitleContextType { title: string; setTitle: (title: string) => void }

export const PageTitleContext = React.createContext<PageTitleContextType>({ title: "", setTitle: () => {} });

export const usePageTitle = (title?: string) => {
  const { setTitle } = React.useContext(PageTitleContext);
  React.useEffect(() => {
    setTitle(title || "");
    return () => setTitle("");
  }, [title, setTitle]);
};
