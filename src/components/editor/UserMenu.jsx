'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

function UserMenu() {
  const router = useRouter();
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
          "hover:bg-zinc-100",
          isOpen && "bg-zinc-100"
        )}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#04D1FC] to-[#17A298] flex items-center justify-center text-white text-xs font-medium overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Name (hidden on small screens) */}
        <span className="text-sm font-medium text-zinc-700 hidden sm:block max-w-[100px] truncate">
          {displayName}
        </span>

        <ChevronDown className={cn(
          "w-4 h-4 text-zinc-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900 truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              Settings
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
