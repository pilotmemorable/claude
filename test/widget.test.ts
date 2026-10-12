// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LABELS_EN,
  LABELS_TR,
  mountFeedbackButton,
  type FeedbackButtonHandle,
} from "../src/feedback/widget";

let root: HTMLElement;
let handle: FeedbackButtonHandle | undefined;

beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
});

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  root.remove();
});

function okFetch() {
  return vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 201 }));
}

function q<T extends Element>(selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
}

function submitForm(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

const status = () => q<HTMLParagraphElement>(".omnia-feedback__status");

describe("feedback button", () => {
  it("renders a button with the Turkish label by default and a hidden form", () => {
    handle = mountFeedbackButton(root, { endpoint: "/api/feedback", fetchImpl: okFetch() });

    expect(handle.button.textContent).toBe(LABELS_TR.button);
    expect(handle.button.getAttribute("aria-expanded")).toBe("false");
    expect(handle.button.getAttribute("aria-controls")).toBe(handle.form.id);
    expect(handle.form.hidden).toBe(true);
  });

  it("supports custom labels", () => {
    handle = mountFeedbackButton(root, { endpoint: "/x", labels: LABELS_EN, fetchImpl: okFetch() });
    expect(handle.button.textContent).toBe("Give feedback");
  });

  it("opens and closes the form when clicked, and cancel closes it", () => {
    handle = mountFeedbackButton(root, { endpoint: "/x", fetchImpl: okFetch() });

    handle.button.click();
    expect(handle.form.hidden).toBe(false);
    expect(handle.button.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(q("textarea"));

    handle.button.click();
    expect(handle.form.hidden).toBe(true);

    handle.button.click();
    [...handle.form.querySelectorAll("button")].find((b) => b.textContent === LABELS_TR.cancel)!.click();
    expect(handle.form.hidden).toBe(true);
  });

  it("does not send an empty message", async () => {
    const fetchImpl = okFetch();
    handle = mountFeedbackButton(root, { endpoint: "/x", fetchImpl });
    handle.button.click();

    submitForm(handle.form);
    await vi.waitFor(() => expect(status().textContent).toBe(LABELS_TR.empty));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs the feedback as JSON, then resets and shows success", async () => {
    const fetchImpl = okFetch();
    handle = mountFeedbackButton(root, { endpoint: "/api/feedback", page: "/tours/kayakoy", fetchImpl });
    handle.button.click();
    q<HTMLSelectElement>("select").value = "5";
    q<HTMLTextAreaElement>("textarea").value = "  Rehber çok iyiydi  ";

    submitForm(handle.form);
    await vi.waitFor(() => expect(status().textContent).toBe(LABELS_TR.success));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/feedback");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      message: "Rehber çok iyiydi",
      rating: 5,
      page: "/tours/kayakoy",
    });
    expect(handle.form.hidden).toBe(true);
    expect(q<HTMLTextAreaElement>("textarea").value).toBe("");
  });

  it("omits the rating when none is chosen", async () => {
    const fetchImpl = okFetch();
    handle = mountFeedbackButton(root, { endpoint: "/x", page: "/", fetchImpl });
    handle.button.click();
    q<HTMLTextAreaElement>("textarea").value = "hi";

    submitForm(handle.form);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toEqual({ message: "hi", page: "/" });
  });

  it("shows an error and keeps the text when the server fails", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 500 }));
    handle = mountFeedbackButton(root, { endpoint: "/x", fetchImpl });
    handle.button.click();
    q<HTMLTextAreaElement>("textarea").value = "Bir sorun var";

    submitForm(handle.form);
    await vi.waitFor(() => expect(status().textContent).toBe(LABELS_TR.error));
    expect(handle.form.hidden).toBe(false);
    expect(q<HTMLTextAreaElement>("textarea").value).toBe("Bir sorun var");
    expect(q<HTMLButtonElement>('button[type="submit"]').disabled).toBe(false);
  });

  it("shows an error when the network request throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network down");
    });
    handle = mountFeedbackButton(root, { endpoint: "/x", fetchImpl });
    handle.button.click();
    q<HTMLTextAreaElement>("textarea").value = "test";

    submitForm(handle.form);
    await vi.waitFor(() => expect(status().textContent).toBe(LABELS_TR.error));
  });

  it("removes itself on destroy", () => {
    handle = mountFeedbackButton(root, { endpoint: "/x", fetchImpl: okFetch() });
    handle.destroy();
    handle = undefined;
    expect(root.querySelector(".omnia-feedback")).toBeNull();
  });
});
