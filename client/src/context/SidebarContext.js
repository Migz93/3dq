import React, { createContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Default to open on desktop, closed on mobile
  const [open, setOpen] = useState(!isMobile);
  // Track if sidebar was manually closed on desktop
  const [manuallyClosedOnDesktop, setManuallyClosedOnDesktop] = useState(false);

  // Update isMobile state when window resizes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Only auto-close when transitioning to mobile
      if (!isMobile && mobile) {
        setOpen(false);
      }
      
      // Only auto-open when transitioning to desktop if it wasn't manually closed
      if (isMobile && !mobile && !manuallyClosedOnDesktop) {
        setOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const toggleSidebar = () => {
    const newOpenState = !open;
    setOpen(newOpenState);
    
    // If we're on desktop and closing the sidebar, track that it was manually closed
    if (!isMobile && !newOpenState) {
      setManuallyClosedOnDesktop(true);
    }
    
    // If we're on desktop and opening the sidebar, reset the manually closed state
    if (!isMobile && newOpenState) {
      setManuallyClosedOnDesktop(false);
    }
  };

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
