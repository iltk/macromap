import { useState } from "react";
import type { LocationDetails } from "../../types/venues";
import { getOpenStatus, weeklySchedule } from "../../utils/openingHours";
import { Icon, type IconName } from "../ui/icons";
import { ui } from "../ui/styles";

export function PlaceInfo({ details, onCopyAddress }: { details: LocationDetails; onCopyAddress: () => void }) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const status = getOpenStatus(details.openingHours);
  const schedule = weeklySchedule(details.openingHours);
  const today = (new Date().getDay() + 6) % 7;

  return (
    <div className="divide-y divide-gray-200">
      <Row icon="place">
        <span>{details.address}</span>
        <button type="button" onClick={onCopyAddress} className={`ml-2 text-xs ${ui.link}`}>
          Copy
        </button>
      </Row>
      <Row icon="clock">
        {!details.openingHours ? (
          <span className="text-gray-500">Hours not listed</span>
        ) : (
          <>
            <button type="button" onClick={() => setHoursOpen((o) => !o)} aria-expanded={hoursOpen} className="flex items-center gap-1 text-left">
              <span className={status ? (status.open ? "text-success-ink" : "text-danger-ink") : ""}>{status?.label ?? "Hours"}</span>
              <Icon name="chevronDown" className={`h-4 w-4 text-gray-500 ${hoursOpen ? "rotate-180" : ""}`} />
            </button>
            {hoursOpen &&
              (schedule ? (
                <table className="mt-2 text-sm text-gray-700">
                  <tbody>
                    {schedule.map((d, i) => (
                      <tr key={d.day} className={i === today ? "font-semibold text-gray-900" : ""}>
                        <td className="py-0.5 pr-6">{d.day}</td>
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
          </>
        )}
      </Row>
      {details.phone && (
        <Row icon="phone">
          <a href={`tel:${details.phone}`} className="hover:underline">{details.phone}</a>
        </Row>
      )}
      {details.website && (
        <Row icon="web">
          <a href={details.website} target="_blank" rel="noreferrer" className="break-all hover:underline">
            {details.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        </Row>
      )}
      <p className="px-4 py-3 text-xs text-gray-500">
        Location details from OpenStreetMap.{" "}
        <a
          href={`https://www.openstreetmap.org/note/new#map=19/${details.latitude}/${details.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Report a problem
        </a>
      </p>
    </div>
  );
}

function Row({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 text-sm text-gray-800">
      <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
