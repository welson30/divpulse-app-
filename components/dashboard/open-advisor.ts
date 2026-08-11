export const OPEN_ADVISOR_EVENT = "pp:open-advisor";

export function openAdvisor() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_ADVISOR_EVENT));
}
