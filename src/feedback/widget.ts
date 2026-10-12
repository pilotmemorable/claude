// Framework-free feedback button. Mount it into any element:
//
//   mountFeedbackButton(document.getElementById("feedback")!, {
//     endpoint: "/api/feedback",
//   });
//
// Clicking the button opens a small form (optional 1–5 rating + message).
// Submitting POSTs JSON to `endpoint` and shows the result in a live region.

import { MAX_MESSAGE_LENGTH, MAX_RATING, MIN_RATING, validateFeedback } from "./types";

export interface FeedbackLabels {
  button: string;
  rating: string;
  noRating: string;
  message: string;
  submit: string;
  cancel: string;
  sending: string;
  success: string;
  error: string;
  empty: string;
}

export const LABELS_TR: FeedbackLabels = {
  button: "Geri bildirim ver",
  rating: "Puan",
  noRating: "Seçilmedi",
  message: "Görüşünüz",
  submit: "Gönder",
  cancel: "Vazgeç",
  sending: "Gönderiliyor…",
  success: "Teşekkürler! Geri bildiriminiz alındı.",
  error: "Gönderilemedi, lütfen tekrar deneyin.",
  empty: "Lütfen bir mesaj yazın.",
};

export const LABELS_EN: FeedbackLabels = {
  button: "Give feedback",
  rating: "Rating",
  noRating: "None",
  message: "Your feedback",
  submit: "Send",
  cancel: "Cancel",
  sending: "Sending…",
  success: "Thank you! Your feedback was received.",
  error: "Could not send, please try again.",
  empty: "Please write a message.",
};

export interface FeedbackButtonOptions {
  endpoint: string;
  labels?: Partial<FeedbackLabels>;
  /** Page identifier sent with the feedback. Defaults to location.pathname. */
  page?: string;
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export interface FeedbackButtonHandle {
  button: HTMLButtonElement;
  form: HTMLFormElement;
  destroy(): void;
}

let instanceCounter = 0;

export function mountFeedbackButton(
  root: HTMLElement,
  options: FeedbackButtonOptions,
): FeedbackButtonHandle {
  const doc = root.ownerDocument;
  const labels: FeedbackLabels = { ...LABELS_TR, ...options.labels };
  const fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  const id = `omnia-feedback-${++instanceCounter}`;

  const wrapper = doc.createElement("div");
  wrapper.className = "omnia-feedback";

  const button = doc.createElement("button");
  button.type = "button";
  button.className = "omnia-feedback__button";
  button.textContent = labels.button;
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `${id}-form`);

  const form = doc.createElement("form");
  form.id = `${id}-form`;
  form.className = "omnia-feedback__form";
  form.hidden = true;
  form.noValidate = true;

  const ratingLabel = doc.createElement("label");
  ratingLabel.htmlFor = `${id}-rating`;
  ratingLabel.textContent = labels.rating;
  const rating = doc.createElement("select");
  rating.id = `${id}-rating`;
  rating.name = "rating";
  const none = doc.createElement("option");
  none.value = "";
  none.textContent = labels.noRating;
  rating.append(none);
  for (let r = MIN_RATING; r <= MAX_RATING; r++) {
    const opt = doc.createElement("option");
    opt.value = String(r);
    opt.textContent = "★".repeat(r);
    rating.append(opt);
  }

  const messageLabel = doc.createElement("label");
  messageLabel.htmlFor = `${id}-message`;
  messageLabel.textContent = labels.message;
  const message = doc.createElement("textarea");
  message.id = `${id}-message`;
  message.name = "message";
  message.maxLength = MAX_MESSAGE_LENGTH;
  message.rows = 4;

  const submit = doc.createElement("button");
  submit.type = "submit";
  submit.textContent = labels.submit;

  const cancel = doc.createElement("button");
  cancel.type = "button";
  cancel.textContent = labels.cancel;

  const status = doc.createElement("p");
  status.className = "omnia-feedback__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  form.append(ratingLabel, rating, messageLabel, message, submit, cancel);
  wrapper.append(button, form, status);
  root.append(wrapper);

  function setOpen(open: boolean): void {
    form.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      status.textContent = "";
      message.focus();
    }
  }

  // `hidden` may be true or "until-found"; anything but false means closed.
  const onButtonClick = () => setOpen(form.hidden !== false);
  const onCancel = () => setOpen(false);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    const payload = {
      message: message.value,
      rating: rating.value === "" ? undefined : Number(rating.value),
      page: options.page ?? doc.defaultView?.location.pathname,
    };
    const result = validateFeedback(payload);
    if (!result.ok) {
      status.textContent = labels.empty;
      return;
    }

    submit.disabled = true;
    status.textContent = labels.sending;
    try {
      const res = await fetchImpl(options.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.value),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setOpen(false);
      status.textContent = labels.success;
    } catch {
      status.textContent = labels.error;
    } finally {
      submit.disabled = false;
    }
  };

  button.addEventListener("click", onButtonClick);
  cancel.addEventListener("click", onCancel);
  form.addEventListener("submit", onSubmit);

  return {
    button,
    form,
    destroy() {
      button.removeEventListener("click", onButtonClick);
      cancel.removeEventListener("click", onCancel);
      form.removeEventListener("submit", onSubmit);
      wrapper.remove();
    },
  };
}
