import React, { createContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Default to open on desktop, closed on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [open, setOpen] = useState(!isMobile);

  // Update isMobile state when window resizes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Only auto-close when transitioning to mobile
      if (!isMobile && mobile) {
        setOpen(false);
      }
      
      // Only auto-open when transitioning to desktop
      if (isMobile && !mobile) {
        setOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
