/** Lightweight product analytics — never logs document content. */

export type QaiMobileEvent =
  | "try_qai_mobile_clicked"
  | "mobile_preview_opened"
  | "mobile_screen_viewed"
  | "qai_orb_opened"
  | "qai_prompt_submitted"
  | "recommendation_opened"
  | "task_completed"
  | "document_uploaded"
  | "document_confirmed"
  | "mobile_beta_interest";

export function trackQaiMobile(
  event: QaiMobileEvent,
  props?: Record<string, string | number | boolean | undefined>
) {
  try {
    if (typeof window === "undefined") return;
    const payload = { event, ...props, ts: Date.now(), product: "qai-mobile" };
    const w = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer?.push(payload);
    w.gtag?.("event", event, props ?? {});
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[qai-mobile]", payload);
    }
  } catch {
    /* ignore */
  }
}
