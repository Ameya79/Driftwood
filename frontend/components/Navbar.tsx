"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isDocs = pathname === "/docs";

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link href="/" className="navbar-logo-link">
            <img src="/logo.png" alt="Driftwood Logo" className="navbar-logo-img" />
            <span className="navbar-logo-text">Driftwood</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            <Link href="/" className={`navbar-link ${pathname === "/" ? "active" : ""}`}>
              Simulator
            </Link>
            <Link href="/docs" className={`navbar-link ${pathname === "/docs" ? "active" : ""}`}>
              API Docs
            </Link>
          </div>

          {/* Mobile Hamburger Menu Icon */}
          <button
            className="navbar-hamburger"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Back-drop overlay */}
      <div
        className={`mobile-sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sliding Sidebar Drawer */}
      <aside className={`mobile-sidebar ${isOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <Link href="/" className="navbar-logo-link">
            <img src="/logo.png" alt="Driftwood Logo" className="navbar-logo-img" />
            <span className="navbar-logo-text">Driftwood</span>
          </Link>
          <button
            className="mobile-sidebar-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mobile-sidebar-links">
          <Link href="/" className={`mobile-sidebar-link ${pathname === "/" ? "active" : ""}`}>
            Simulator
          </Link>
          <Link href="/docs" className={`mobile-sidebar-link ${pathname === "/docs" ? "active" : ""}`}>
            API Docs
          </Link>

          {/* If we are on the Docs page, render document navigation links inside the mobile sidebar */}
          {isDocs && (
            <>
              <div className="mobile-sidebar-divider" />
              <span className="mobile-sidebar-section-title">Docs Navigation</span>
              <div className="mobile-sidebar-sublinks">
                <a
                  href="#intro"
                  className="mobile-sidebar-sublink"
                  onClick={() => setIsOpen(false)}
                >
                  Introduction
                </a>
                <a
                  href="#endpoint"
                  className="mobile-sidebar-sublink"
                  onClick={() => setIsOpen(false)}
                >
                  The Simulator Endpoint
                </a>
                <a
                  href="#examples"
                  className="mobile-sidebar-sublink"
                  onClick={() => setIsOpen(false)}
                >
                  Ways to Use the API
                </a>
                <a
                  href="#format"
                  className="mobile-sidebar-sublink"
                  onClick={() => setIsOpen(false)}
                >
                  Response JSON Structure
                </a>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
