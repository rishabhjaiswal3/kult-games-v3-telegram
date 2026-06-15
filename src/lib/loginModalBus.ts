const LOGIN_OPEN_EVENT = "kult-open-login";

export type LoginModalOpenRequest = {
  mode?: "default" | "recover";
  message?: string;
};

let pendingLoginModalRequest: LoginModalOpenRequest | null = null;

export function requestOpenLoginModal(request?: LoginModalOpenRequest) {
  if (typeof window === "undefined") return;
  pendingLoginModalRequest = request ?? null;
  window.dispatchEvent(
    new CustomEvent<LoginModalOpenRequest | undefined>(LOGIN_OPEN_EVENT, {
      detail: request,
    })
  );
}

export function consumePendingLoginModalRequest() {
  const request = pendingLoginModalRequest;
  pendingLoginModalRequest = null;
  return request;
}

export function subscribeOpenLoginModal(
  listener: (request?: LoginModalOpenRequest) => void
) {
  if (typeof window === "undefined") return () => undefined;
  const handleOpen = (event: Event) => {
    listener(
      event instanceof CustomEvent ? event.detail : undefined
    );
  };
  window.addEventListener(LOGIN_OPEN_EVENT, handleOpen);
  return () => window.removeEventListener(LOGIN_OPEN_EVENT, handleOpen);
}
