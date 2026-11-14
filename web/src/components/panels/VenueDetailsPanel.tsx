import { CATEGORY_COLORS, CATEGORY_ICON_PATHS, CATEGORY_LABELS } from "../../constants/categories";
import type { Coordinates, LocationDetails } from "../../types/venues";
import { distanceMeters, formatDistance } from "../../utils/geo";
import { getOpenStatus } from "../../utils/openingHours";
import { Icon, type IconName } from "../ui/icons";
import { MenuTab } from "./MenuTab";
import { OverviewTab } from "./OverviewTab";

export type PanelTab = "overview" | "menu";

interface VenueDetailsPanelProps {
  open: boolean;
  details: LocationDetails | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
  userPosition: Coordinates | null;
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  focusItemId: string | null;
  onShare: () => void;
  onCopy: (text: string, message: string) => void;
}

export function VenueDetailsPanel(props: VenueDetailsPanelProps) {
  const { open, details, isLoading, error, onRetry, onClose } = props;

  return (
    <aside
      aria-label="Place details"
      aria-hidden={!open}
      className={`fixed z-20 flex flex-col overflow-hidden bg-white shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out
        inset-x-0 bottom-0 h-[62vh] rounded-t-2xl
        md:inset-y-0 md:pt-[72px] md:right-auto md:left-0 md:h-auto md:w-[408px] md:rounded-none
        ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:-translate-x-full"}`}
    >
      {/* mobile grab handle */}
      <div className="flex justify-center pt-2 md:hidden">
        <span className="h-1 w-10 rounded-full bg-gray-300" />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 z-30 rounded-full bg-white/90 p-1.5 text-gray-700 shadow hover:bg-white md:top-[84px]"
      >
        <Icon name="close" className="h-5 w-5" />
      </button>

      {/* desktop: the aside's top padding leaves room for the floating search bar */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-gray-900">
              {error === "Not found" ? "This place no longer exists" : "Couldn't load this place"}
            </p>
            {error !== "Not found" && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-[#1a73e8] hover:bg-gray-50"
              >
                Try again
              </button>
            )}
          </div>
        ) : isLoading || !details ? (
          <PanelSkeleton />
        ) : (
          <PanelContent {...props} details={details} />
        )}
      </div>
    </aside>
  );
}

function PanelContent({
  details,
  userPosition,
  tab,
  onTabChange,
  focusItemId,
  onShare,
  onCopy,
}: VenueDetailsPanelProps & { details: LocationDetails }) {
  const color = CATEGORY_COLORS[details.category] ?? CATEGORY_COLORS.restaurant;
  const status = getOpenStatus(details.openingHours);
  const distance = userPosition
    ? formatDistance(
        distanceMeters(userPosition, { lat: details.latitude, lng: details.longitude }),
      )
    : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${details.latitude},${details.longitude}`;

  return (
    <>
      {/* hero */}
      <div
        className="relative flex h-36 items-end overflow-hidden px-6 pb-4"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb 60%, ${color}88)` }}
      >
        <svg
          viewBox="0 0 24 24"
          className="absolute -top-4 -right-6 h-44 w-44 text-white/15"
          fill="currentColor"
          aria-hidden
        >
          <path d={CATEGORY_ICON_PATHS[details.category] ?? CATEGORY_ICON_PATHS.restaurant} />
        </svg>
        <span className="rounded-md bg-white/95 px-2 py-1 text-xs font-semibold tracking-wide uppercase" style={{ color }}>
          {details.name}
        </span>
      </div>

      <div className="px-6 pt-4 pb-3">
        <h2 className="text-[22px] leading-7 text-gray-900">{details.name}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {CATEGORY_LABELS[details.category] ?? "Restaurant"}
          {distance && <> · {distance}</>}
        </p>
        {status && (
          <p className={`mt-1 text-sm ${status.open ? "text-[#188038]" : "text-[#d93025]"}`}>
            {status.label}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-600">{details.address}</p>
      </div>

      {/* action buttons */}
      <div className="flex justify-around border-b border-gray-200 px-4 pb-4">
        <Action icon="directions" label="Directions" href={directionsUrl} primary />
        {details.website && <Action icon="web" label="Website" href={details.website} />}
        {details.phone && <Action icon="phone" label="Call" href={`tel:${details.phone}`} />}
        <Action icon="share" label="Share" onClick={onShare} />
      </div>

      {/* tabs */}
      <div role="tablist" className="flex border-b border-gray-200">
        {(["overview", "menu"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => onTabChange(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-[3px] border-[#1a73e8] text-[#1a73e8]"
                : "border-b-[3px] border-transparent text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "menu" ? `Menu & macros${details.menu.length ? ` (${details.menu.length})` : ""}` : "Overview"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          details={details}
          onCopyAddress={() => onCopy(details.address, "Address copied")}
        />
      ) : (
        <MenuTab
          key={details.restaurantId}
          restaurantName={details.name}
          menu={details.menu}
          focusItemId={focusItemId}
        />
      )}
    </>
  );
}

function Action({
  icon,
  label,
  href,
  onClick,
  primary,
}: {
  icon: IconName;
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const circle = (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full ${
        primary ? "bg-[#1a73e8] text-white" : "border border-gray-300 text-[#1a73e8]"
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
    </span>
  );
  const cls = "flex w-16 flex-col items-center gap-1 text-xs text-[#1a73e8] hover:opacity-80";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {circle}
      {label}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {circle}
      {label}
    </button>
  );
}

function PanelSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading">
      <div className="h-36 bg-gray-200" />
      <div className="space-y-3 px-6 py-5">
        <div className="h-6 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </div>
      <div className="flex justify-around px-4 pb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-gray-200" />
        ))}
      </div>
      <div className="space-y-4 px-6 py-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
