// app/components/Navbar.jsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/src/app/context/ThemeContext";
import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegisterModal";
import {
  Home,
  BriefcaseBusiness,
  UserRoundPlus,
  Trophy,
  FolderKanban,
  Images,
  HelpCircle,
  Users,
  Mail,
  Sun,
  Moon,
  LogOut,
  LogIn,
  ChevronDown,
  Sparkles,
  User,
  Settings,
  Bell,
  Bookmark,
  FileText,
  Shield,
  CreditCard,
  Heart,
  Star,
  Zap,
  Palette,
  Check,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/", icon: Home, badge: null },
  { name: "Find Job", href: "/jobs", icon: BriefcaseBusiness, badge: "Hot" },
  { name: "Register", href: "/register", icon: UserRoundPlus, badge: null },
  { name: "Success Stories", href: "/sucessStories", icon: Trophy, badge: "New" },
  { name: "Interview Prep", href: "/interview-prep", icon: FolderKanban, badge: null },
  { name: "Gallery", href: "/gallery", icon: Images, badge: null },
  { name: "Resources", href: "/resources", icon: FileText, badge: null },
  { name: "Privacy Policies", href: "/privacy-policies", icon: Shield, badge: null },
  { name: "About", href: "/about", icon: Users, badge: null },
  { name: "Contact", href: "/contact", icon: Mail, badge: null },
];

// Memoized Nav Links Component
const NavLinks = memo(({ isOpen, pathname }) => (
  <>
    {navLinks.map((link) => {
      const Icon = link.icon;
      const isActive = pathname === link.href;
      return (
        <Link key={link.name} href={link.href}>
          <span className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Icon className="w-4 h-4" />
            {link.name}
            {link.badge && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{link.badge}</span>}
          </span>
        </Link>
      );
    })}
  </>
));

NavLinks.displayName = 'NavLinks';

const Navbar = memo(() => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const {
    theme,
    toggleTheme: contextToggleTheme,
    mounted: themeMounted,
    colorTheme,
    setColorTheme,
    themeOptions,
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loginCallbackUrl, setLoginCallbackUrl] = useState("/");
  const [registerCallbackUrl, setRegisterCallbackUrl] = useState("/register");
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [hideMenuItems, setHideMenuItems] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMoreMenuClicked, setIsMoreMenuClicked] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);
  const sheetRef = useRef(null);
  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const themeMenuRef = useRef(null);
  const themeDropdownRef = useRef(null);
  const navContainerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const isLoggedIn = status === "authenticated" && session?.user;
  const activeThemeOption = useMemo(
    () => themeOptions?.find((option) => option.key === colorTheme) || themeOptions?.[0],
    [themeOptions, colorTheme]
  );

  // Reset image error when session or image URL changes
  useEffect(() => {
    setImageError(false);
  }, [session?.user?.image, session?.user?.email]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
    document.documentElement.style.setProperty('--ancient-red', '#8B0000');
    document.documentElement.style.setProperty('--ancient-red-light', '#B22222');
    document.documentElement.style.setProperty('--ancient-red-dark', '#660000');
  }, []);

  // Scroll handling with hide/show effect - optimized with debouncing
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    setIsScrolled(currentScrollY > 20);

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setShowNavbar(false);
      setHideMenuItems(true);
    } else {
      setShowNavbar(true);
      setHideMenuItems(false);
    }

    if (currentScrollY > lastScrollY + 10) {
      setIsUserMenuOpen(false);
      setIsMoreMenuOpen(false);
      setIsMoreMenuClicked(false);
      setIsThemeMenuOpen(false);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Add scroll listener with passive flag
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Mouse move listener to detect when mouse leaves navbar
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!navContainerRef.current || !isMoreMenuOpen || isMoreMenuClicked) return;

      const navRect = navContainerRef.current.getBoundingClientRect();
      const isMouseInNavbar = (
        e.clientX >= navRect.left &&
        e.clientX <= navRect.right &&
        e.clientY >= navRect.top &&
        e.clientY <= navRect.bottom
      );

      if (!isMouseInNavbar) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen && !isMoreMenuClicked) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMoreMenuOpen, isMoreMenuClicked]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }

      // Close More dropdown when clicking outside
      if (
        isMoreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target) &&
        !moreDropdownRef.current?.contains(event.target)
      ) {
        setIsMoreMenuOpen(false);
        setIsMoreMenuClicked(false);
      }

      if (
        isThemeMenuOpen &&
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target) &&
        !themeDropdownRef.current?.contains(event.target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMoreMenuOpen, isThemeMenuOpen]);

  // Touch swipe handlers for mobile menu
  const handleTouchStart = useCallback((e) => {
    setSwipeStartY(e.touches[0].clientY);
    setSwipeDistance(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isOpen) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - swipeStartY;

    if (distance > 0) {
      setSwipeDistance(distance);

      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${Math.min(distance * 0.7, 100)}px)`;
      }
    }
  }, [isOpen, swipeStartY]);

  const handleTouchEnd = useCallback(() => {
    if (swipeDistance > 100) {
      setIsOpen(false);
    }

    if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }

    setSwipeDistance(0);
  }, [swipeDistance]);

  // Toggle theme with smooth transition
  const toggleTheme = () => {
    contextToggleTheme();
  };

  // Handle logout with NextAuth
  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsUserMenuOpen(false);
    router.push("/");
  };

  // Modal event listeners
  useEffect(() => {
    const handleOpenLogin = () => {
      setLoginCallbackUrl("/");
      setIsLoginOpen(true);
    };
    const handleOpenRegister = () => {
      setRegisterCallbackUrl("/register");
      setIsRegisterOpen(true);
    };
    const handleOpenRegisterWithCallback = (event) => {
      const callbackUrl = event.detail?.callbackUrl || "/register";
      setRegisterCallbackUrl(callbackUrl);
      setIsRegisterOpen(true);
    };

    window.addEventListener("openLogin", handleOpenLogin);
    window.addEventListener("openRegister", handleOpenRegister);
    window.addEventListener("openRegisterWithCallback", handleOpenRegisterWithCallback);

    return () => {
      window.removeEventListener("openLogin", handleOpenLogin);
      window.removeEventListener("openRegister", handleOpenRegister);
      window.removeEventListener("openRegisterWithCallback", handleOpenRegisterWithCallback);
    };
  }, []);

  // Handle More menu enter (container)
  const handleMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMoreMenuClicked) {
      setIsMoreMenuOpen(true);
    }
  };

  // Handle More button click
  const handleMoreClick = () => {
    if (isMoreMenuOpen && !isMoreMenuClicked) {
      setIsMoreMenuClicked(true);
    } else {
      setIsMoreMenuClicked(!isMoreMenuClicked);
      setIsMoreMenuOpen(!isMoreMenuOpen);
    }
  };

  // Handle link click in dropdown
  const handleMoreLinkClick = () => {
    setIsMoreMenuOpen(false);
    setIsMoreMenuClicked(false);
  };

  // Handle More menu leave (container)
  const handleMenuLeave = () => {
    if (!isMoreMenuClicked) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsMoreMenuOpen(false);
      }, 150);
    }
  };

  if (!mounted || !themeMounted) {
    return (
      <div className="h-16 bg-white dark:bg-black">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-900 dark:to-black rounded-lg animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-900 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-900 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} callbackUrl={loginCallbackUrl} />

      {/* Register Modal */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} callbackUrl={registerCallbackUrl} />

      <nav
        ref={navContainerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'
          } ${isScrolled
            ? 'bg-white dark:bg-black shadow-2xl border-b border-gray-100 dark:border-gray-900'
            : 'bg-white dark:bg-black border-b border-transparent'
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo with Ancient Red Accent */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center transform group-hover:rotate-[360deg] transition-all duration-700 shadow-lg shadow-red-900/30">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#B22222] to-[#FF2400] rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-lg sm:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#B22222] bg-clip-text text-transparent leading-tight">
                  Job App
                </h1>
                <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 -mt-0.5 font-medium tracking-wide">Find Job, Earn, Grow</p>
              </div>
            </Link>

            {/* Desktop Navigation with Ancient Red */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center space-x-1 bg-white dark:bg-black p-1.5 rounded-2xl border border-gray-200 dark:border-gray-900">
                {navLinks.slice(0, 5).map((link) => {
                  if (link.name === 'Register' && !isLoggedIn) {
                    return (
                      <button
                        key={link.name}
                        onClick={(e) => {
                          e.preventDefault();
                          setLoginCallbackUrl('/register');
                          setIsLoginOpen(true);
                        }}
                        className={`relative px-4 py-2 rounded-xl transition-all duration-300 group whitespace-nowrap ${pathname === link.href
                          ? 'bg-gradient-to-r from-[#8B0000]/10 to-[#B22222]/10 text-[#8B0000] dark:text-[#B22222] border border-[#8B0000]/20'
                          : 'text-gray-800 dark:text-gray-300 hover:text-[#8B0000] dark:hover:text-[#B22222] hover:bg-gray-50 dark:hover:bg-gray-900'
                          }`}
                      >
                        <span className="flex items-center space-x-2 text-sm font-semibold">
                          <link.icon className={`w-4 h-4 ${pathname === link.href ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                          <span>{link.name}</span>
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-4 py-2 rounded-xl transition-all duration-300 group whitespace-nowrap ${pathname === link.href
                        ? 'bg-gradient-to-r from-[#8B0000]/10 to-[#B22222]/10 text-[#8B0000] dark:text-[#B22222] border border-[#8B0000]/20'
                        : 'text-gray-800 dark:text-gray-300 hover:text-[#8B0000] dark:hover:text-[#B22222] hover:bg-gray-50 dark:hover:bg-gray-900'
                        }`}
                    >
                      <span className="flex items-center space-x-2 text-sm font-semibold">
                        <link.icon className={`w-4 h-4 ${pathname === link.href ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span>{link.name}</span>
                        {link.badge && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white rounded-full shadow-sm">
                            {link.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}

                {/* More Dropdown - Fixed with proper hover/click behavior */}
                <div
                  className="relative"
                  ref={moreMenuRef}
                  onMouseEnter={handleMenuEnter}
                  onMouseLeave={handleMenuLeave}
                >
                  <button
                    onClick={handleMoreClick}
                    aria-expanded={isMoreMenuOpen}
                    aria-haspopup="true"
                    className={`flex items-center space-x-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${isMoreMenuOpen || navLinks.slice(5).some(link => pathname === link.href)
                      ? 'bg-gradient-to-r from-[#8B0000]/10 to-[#B22222]/10 text-[#8B0000] dark:text-[#B22222] border border-[#8B0000]/20'
                      : 'text-gray-800 dark:text-gray-300 hover:text-[#8B0000] dark:hover:text-[#B22222] hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                  >
                    <span>More</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <div
                      ref={moreDropdownRef}
                      className="absolute right-0 top-full mt-2 w-56 origin-top-right z-50 animate-dropdown"
                    >
                      <div className="py-2 bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-900 overflow-hidden">
                        {navLinks.slice(5).map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={handleMoreLinkClick}
                            className={`flex items-center justify-between px-4 py-3 transition-all duration-200 group/item ${pathname === link.href
                              ? 'bg-gradient-to-r from-[#8B0000]/5 to-[#B22222]/5'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-1.5 rounded-lg transition-colors ${pathname === link.href
                                ? 'bg-gradient-to-br from-[#8B0000] to-[#B22222]'
                                : 'bg-gray-100 dark:bg-gray-900 group-hover/item:bg-[#8B0000]/10 dark:group-hover/item:bg-[#B22222]/20'
                                }`}>
                                <link.icon className={`w-4 h-4 ${pathname === link.href
                                  ? 'text-white'
                                  : 'text-gray-600 dark:text-gray-400 group-hover/item:text-[#8B0000] dark:group-hover/item:text-[#B22222]'
                                  }`} />
                              </div>
                              <span className={`text-sm font-medium ${pathname === link.href
                                ? 'text-[#8B0000] dark:text-[#B22222] font-bold'
                                : 'text-gray-800 dark:text-gray-300'
                                }`}>{link.name}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">

              {/* Color Bubble Theme Selector */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                  className="relative p-2 sm:p-2.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-300"
                  aria-expanded={isThemeMenuOpen}
                  aria-haspopup="true"
                  aria-label="Open color theme picker"
                  title="Pick color theme"
                >
                  <span
                    className="block w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/70 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${activeThemeOption?.colors?.primary || "#8B0000"} 0%, ${activeThemeOption?.colors?.secondary || "#B22222"} 100%)`,
                    }}
                  />
                </button>

                {isThemeMenuOpen && (
                  <div
                    ref={themeDropdownRef}
                    className="absolute right-0 top-full mt-2 w-80 z-50 animate-dropdown"
                  >
                    <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-900">
                      <div className="flex items-center space-x-2 mb-3">
                        <Palette className="w-4 h-4 text-[#8B0000] dark:text-[#B22222]" />
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Choose Theme Color</p>
                      </div>
                      <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                        {themeOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setColorTheme(option.key);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-200 ${colorTheme === option.key
                              ? "bg-[#8B0000]/10 dark:bg-[#B22222]/20"
                              : "hover:bg-gray-100 dark:hover:bg-gray-900"
                              }`}
                            title={option.name}
                            aria-label={`Set color theme ${option.name}`}
                          >
                            <span
                              className="w-8 h-8 rounded-full border border-white/80 shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${option.colors.primary} 0%, ${option.colors.secondary} 100%)`,
                              }}
                            />
                            {colorTheme === option.key && (
                              <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-[#8B0000] dark:text-[#B22222]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2.5 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-300 group"
                aria-label="Toggle theme"
              >
                <div className="relative z-10">
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
                  ) : (
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:-rotate-12 transition-transform duration-500" />
                  )}
                </div>
              </button>

              {/* User Avatar */}
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#B22222] p-0.5 shadow-md group-hover:shadow-lg transition-all duration-300">
                        <div className="w-full h-full rounded-[10px] bg-white dark:bg-black overflow-hidden flex items-center justify-center">
                          {session?.user?.image && !imageError ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || "Student Profile"}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                              onError={() => setImageError(true)}
                              onLoad={() => {
                                if (imageError) setImageError(false);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center text-white text-lg font-bold">
                              {session?.user?.name?.[0]?.toUpperCase() || "S"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#B22222] to-[#FF2400] rounded-full border-2 border-white dark:border-black"></div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#8B0000] dark:group-hover:text-[#B22222] transition-colors">
                        {session?.user?.name || "Student"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {session?.user?.provider === "google" ? "Google Login" : "Premium Student"}
                      </p>
                    </div>
                  </button>

                  {/* User Dropdown Menu - Hidden on scroll */}
                  {isUserMenuOpen && !hideMenuItems && (
                    <div className="absolute right-0 top-full mt-4 w-80 origin-top-right animate-dropdown z-50">
                      <div className="p-3 bg-white dark:bg-black rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-900">

                        {/* User Info with Ancient Red */}
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black rounded-2xl mb-2 border border-gray-200 dark:border-gray-900">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#B22222] p-0.5">
                              <div className="w-full h-full rounded-[14px] bg-white dark:bg-black overflow-hidden flex items-center justify-center">
                                {session?.user?.image && !imageError ? (
                                  <Image
                                    src={session.user.image}
                                    alt={session.user.name || "Profile"}
                                    width={56}
                                    height={56}
                                    className="object-cover"
                                    onError={(e) => {
                                      console.error("Image load error:", session.user.image);
                                      setImageError(true);
                                    }}
                                    onLoad={() => {
                                      if (imageError) setImageError(false);
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center text-white text-2xl font-bold">
                                    {session?.user?.name?.[0]?.toUpperCase() || "S"}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900 dark:text-white">
                                {session?.user?.name || "Student"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {session?.user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white rounded-full">
                              Premium Member
                            </span>
                            <Star className="w-4 h-4 text-amber-500" />
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-1">
                          <Link
                            href="/myProfile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-[#8B0000]/10 to-[#B22222]/10 text-[#8B0000] dark:text-[#B22222] group-hover:from-[#8B0000]/20 group-hover:to-[#B22222]/20 transition-colors">
                                <User className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-gray-800 dark:text-gray-300">My Profile</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                          </Link>



                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-[#8B0000]/5 hover:to-[#B22222]/5 dark:hover:from-[#8B0000]/10 dark:hover:to-[#B22222]/10 transition-all duration-200 group"
                          >
                            <div className="p-2 rounded-lg bg-gradient-to-br from-[#8B0000]/10 to-[#B22222]/10 text-[#8B0000] dark:text-[#B22222] group-hover:from-[#8B0000]/20 group-hover:to-[#B22222]/20 transition-colors">
                              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <span className="font-semibold text-[#8B0000] dark:text-[#B22222]">Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="hidden sm:flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] hover:from-[#660000] hover:to-[#8B0000] text-white font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/30 active:translate-y-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center"
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute h-0.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full transition-all duration-300 ${isOpen ? 'top-3 w-0 left-1/2' : 'top-1 w-6 left-0'
                    }`}></span>
                  <span className={`absolute top-3 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 w-6' : 'w-6'
                    }`}></span>
                  <span className={`absolute top-3 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 w-6' : 'w-6'
                    }`}></span>
                  <span className={`absolute h-0.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full transition-all duration-300 ${isOpen ? 'top-3 w-0 left-1/2' : 'top-5 w-6 left-0'
                    }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Sheet with Swipe Gesture */}
      {isOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden">
          {/* Backdrop with fade effect */}
          <div
            className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
              }`}
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet with swipe gesture */}
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-black rounded-t-3xl shadow-2xl animate-slideUp"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe indicator */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer active:cursor-grabbing"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-12 h-1.5 bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full"></div>
            </div>

            {/* User Profile Section */}
            <div className="px-6 pt-4 pb-6">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#8B0000]/5 to-[#B22222]/5 dark:from-[#8B0000]/10 dark:to-[#B22222]/10 rounded-2xl mb-6 border border-[#8B0000]/10 dark:border-[#8B0000]/20">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#B22222] p-0.5">
                      <div className="w-full h-full rounded-xl bg-white dark:bg-black overflow-hidden flex items-center justify-center">
                        {session?.user?.image && !imageError ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "Profile"}
                            width={56}
                            height={56}
                            className="object-cover"
                            onError={(e) => {
                              console.error("Image load error:", session.user.image);
                              setImageError(true);
                            }}
                            onLoad={() => {
                              if (imageError) setImageError(false);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center text-white text-2xl font-bold">
                            {session?.user?.name?.[0]?.toUpperCase() || "S"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#B22222] to-[#FF2400] rounded-full border-2 border-white dark:border-black flex items-center justify-center">
                      <Star className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {session?.user?.name || "Student"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-[#8B0000]/5 to-[#B22222]/5 dark:from-[#8B0000]/10 dark:to-[#B22222]/10 rounded-2xl mb-6 border border-[#8B0000]/10 dark:border-[#8B0000]/20">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Join Our Community</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Access job opportunities, resources & career growth</p>
                  <button
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white font-semibold rounded-xl shadow-lg shadow-red-900/30 active:scale-95 transition-transform duration-200"
                  >
                    Login / Sign Up Free
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Link
                  href="/myProfile"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-900"
                >
                  <User className="w-5 h-5 text-[#8B0000] dark:text-[#B22222] mb-1" />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Profile</span>
                </Link>
                <button
                  onClick={toggleTheme}
                  className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-900"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-500 mb-1" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 mb-1" />
                  )}
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Theme</span>
                </button>
                <button
                  onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-900"
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/80 mb-1"
                    style={{
                      background: `linear-gradient(135deg, ${activeThemeOption?.colors?.primary || "#8B0000"} 0%, ${activeThemeOption?.colors?.secondary || "#B22222"} 100%)`,
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Colors</span>
                </button>
              </div>

              {isThemeMenuOpen && (
                <div className="mb-6 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-900">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Pick a color bubble theme</p>
                  <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                    {themeOptions.map((option) => (
                      <button
                        key={`mobile-${option.key}`}
                        type="button"
                        onClick={() => setColorTheme(option.key)}
                        className={`relative p-1 rounded-lg transition-colors ${colorTheme === option.key
                          ? "bg-[#8B0000]/10 dark:bg-[#B22222]/20"
                          : "hover:bg-gray-100 dark:hover:bg-black"
                          }`}
                        title={option.name}
                        aria-label={`Set color theme ${option.name}`}
                      >
                        <span
                          className="block w-8 h-8 rounded-full border border-white/80"
                          style={{
                            background: `linear-gradient(135deg, ${option.colors.primary} 0%, ${option.colors.secondary} 100%)`,
                          }}
                        />
                        {colorTheme === option.key && (
                          <Check className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[#8B0000] dark:text-[#B22222]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-2">
                {navLinks.map((link, index) => {
                  const Icon = link.icon;

                  if (link.name === 'Register' && !isLoggedIn) {
                    return (
                      <button
                        key={link.name}
                        onClick={() => {
                          setIsOpen(false);
                          setLoginCallbackUrl('/register');
                          setIsLoginOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 group active:scale-[0.98] border border-transparent hover:border-[#8B0000]/10"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${pathname === link.href
                            ? 'from-[#8B0000] to-[#B22222]'
                            : 'from-gray-100 to-gray-50 dark:from-gray-900 dark:to-black'
                            }`}>
                            <Icon className={`w-5 h-5 ${pathname === link.href
                              ? 'text-white'
                              : 'text-gray-600 dark:text-gray-400'
                              }`} />
                          </div>
                          <span className={`font-medium ${pathname === link.href
                            ? 'text-[#8B0000] dark:text-[#B22222]'
                            : 'text-gray-800 dark:text-gray-300'
                            }`}>
                            {link.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {link.badge && (
                            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white rounded-full">
                              {link.badge}
                            </span>
                          )}
                          <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 group active:scale-[0.98] border border-transparent hover:border-[#8B0000]/10"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${pathname === link.href
                          ? 'from-[#8B0000] to-[#B22222]'
                          : 'from-gray-100 to-gray-50 dark:from-gray-900 dark:to-black'
                          }`}>
                          <Icon className={`w-5 h-5 ${pathname === link.href
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400'
                            }`} />
                        </div>
                        <span className={`font-medium ${pathname === link.href
                          ? 'text-[#8B0000] dark:text-[#B22222]'
                          : 'text-gray-800 dark:text-gray-300'
                          }`}>
                          {link.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {link.badge && (
                          <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white rounded-full">
                            {link.badge}
                          </span>
                        )}
                        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />

      {/* Global Styles */}
      <style jsx global>{`
        /* Set pitch black and pure white theme */
        :root {
          --ancient-red: #8B0000;
          --ancient-red-light: #B22222;
          --ancient-red-dark: #660000;
        }
        
        .dark {
          background-color: #000000 !important;
        }
        
        .light {
          background-color: #ffffff !important;
        }
        
        /* Remove default focus outline */
        button, a, input, select, textarea {
          outline: none;
        }
        
        button:focus, a:focus, input:focus, select:focus, textarea:focus {
          outline: none;
          box-shadow: none;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes dropdown {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-dropdown {
          animation: dropdown 0.2s ease-out forwards;
        }
        
        .animate-pulse-red {
          animation: pulse-red 2s ease-in-out infinite;
        }
        
        /* Theme transition */
        .theme-transition * {
          transition: background-color 0.3s ease, border-color 0.3s ease !important;
        }
        
        /* Smooth scrollbar */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 0, 0, 0.5) transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8B0000, #B22222);
          border-radius: 3px;
        }
        
        /* Enhanced selection with ancient red */
        ::selection {
          background-color: rgba(139, 0, 0, 0.3);
          color: inherit;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        
        /* Better focus styles with ancient red */
        button:focus-visible, a:focus-visible {
          outline: 2px solid #8B0000;
          outline-offset: 2px;
          border-radius: 0.375rem;
        }
        
        /* Mobile menu swipe feedback */
        .active:cursor-grabbing {
          cursor: grabbing;
        }
        
        /* Ancient red glow effects */
        .glow-red {
          box-shadow: 0 0 20px rgba(139, 0, 0, 0.3);
        }
        
        .hover-glow-red:hover {
          box-shadow: 0 0 25px rgba(139, 0, 0, 0.4);
        }
        
        /* Gradient text for ancient red */
        .text-gradient-ancient-red {
          background: linear-gradient(135deg, #8B0000 0%, #B22222 50%, #FF2400 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;