import type { Venue } from "../types/venues";

async function fetchVenues(): Promise<Venue[]> {
  try {
    const response = await fetch("/api/restaurants/pins");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as Venue[];
    console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch venues:", error);
    throw error;
  }
}

export default fetchVenues;
