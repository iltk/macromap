import { useState } from "react";
import type { LocationDetails } from "../../types/venues";
import { getOpenStatus, weeklySchedule } from "../../utils/openingHours";
import { Icon, type IconName } from "../ui/icons";

export function OverviewTab({
  details,
  onCopyAddress,
}: {
  details: LocationDetails;
  onCopyAddress: () => void;
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const status = getOpenStatus(details.openingHours);
  const schedule = weeklySchedule(details.openingHours);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <ul className="py-2">
      <Row icon="place">
        <button
          type="button"
          onClick={onCopyAddress}
          className="group flex w-full items-center justify-between gap-2 text-left"
          title="Copy address"
        >
          <span>{details.address}</span>
          <Icon name="copy" className="h-4 w-4 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
        </button>
      </Row>

      <Row icon="clock">
        {details.openingHours ? (
          <div>
            <button
              type="button"
              onClick={() => setHoursOpen((o) => !o)}
              className="flex items-center gap-1 text-left"
              aria-expanded={hoursOpen}
            >
              {status ? (
                <span className={status.open ? "text-[#188038]" : "text-[#d93025]"}>
                  {status.label}
                </span>
              ) : (
                <span>Hours</span>
              )}
              <Icon
                name="chevronDown"
                className={`h-5 w-5 text-gray-500 transition-transform ${hoursOpen ? "rotate-180" : ""}`}
              />
            </button>
            {hoursOpen &&
              (schedule ? (
                <table className="mt-2 text-sm">
                  <tbody>
                    {schedule.map((d, i) => (
                      <tr key={d.day} className={i === todayIdx ? "font-semibold" : ""}>
                        <td className="pr-6 py-0.5">{d.day}</td>
                        <td className="py-0.5">{d.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm whitespace-pre-line text-gray-700">
                  {details.openingHours.split(";").map((s) => s.trim()).join("\n")}
                </p>
              ))}
          </div>
        ) : (
          <span className="text-gray-500">Hours not listed</span>
        )}
      </Row>

      {details.phone && (
        <Row icon="phone">
          <a href={`tel:${details.phone}`} className="hover:underline">
            {details.phone}
          </a>
        </Row>
      )}

      {details.website && (
        <Row icon="web">
          <a
            href={details.website}
            target="_blank"
            rel="noreferrer"
            className="break-all hover:underline"
          >
            {details.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        </Row>
      )}

      <li className="px-6 pt-4 text-[11px] text-gray-400">
        Location info from OpenStreetMap contributors. Something wrong?{" "}
        <a
          href={`https://www.openstreetmap.org/note/new#map=19/${details.latitude}/${details.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Report it on OSM
        </a>
        .
      </li>
    </ul>
  );
}

function Row({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-6 px-6 py-3 text-sm text-gray-800 hover:bg-gray-50">
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0 text-[#1a73e8]" />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
