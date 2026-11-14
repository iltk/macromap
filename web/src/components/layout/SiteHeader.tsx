import { Link, NavLink } from "react-router";
import { Icon } from "../ui/icons";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-1.5 ${className}`} aria-label="MacroMap home">
      <svg viewBox="0 0 32 42" className="h-7 w-auto" aria-hidden>
        <path
          fill="#ea4335"
          d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26s16-15.5 16-26c0-8.837-7.163-16-16-16z"
        />
        <circle cx="16" cy="16" r="10" fill="#fff" />
        <path fill="#1a73e8" d="M11 21v-9h2.2l2.8 4.6 2.8-4.6H21v9h-2.2v-5.4L16 20l-2.8-4.4V21z" />
      </svg>
      <span className="text-[22px] font-medium tracking-tight text-gray-900">
        Macro<span className="text-[#1a73e8]">Map</span>
      </span>
    </Link>
  );
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 py-1 text-[15px] transition-colors ${
    isActive
      ? "border-[#1a73e8] text-[#1a73e8]"
      : "border-transparent text-gray-700 hover:text-gray-900"
  }`;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-6">
          <NavLink to="/restaurants" end={false} className={navCls}>
            Restaurants
          </NavLink>
          <NavLink to="/" end className={navCls}>
            Map
          </NavLink>
        </nav>
        <Link
          to="/"
          className="hidden items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:flex"
        >
          <Icon name="place" className="h-4 w-4 text-[#ea4335]" />
          Find near me
        </Link>
      </div>
    </header>
  );
}
