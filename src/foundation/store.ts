import { createStore } from "zustand/vanilla";
import type {
  FoundationEchoResponse,
  FoundationStatus,
  TypedError,
} from "./contracts";

export interface FoundationViewState {
  activeRoute: "canary" | "foundation";
  status: FoundationStatus | null;
  echo: FoundationEchoResponse | null;
  loading: boolean;
  error: TypedError | null;
  setRoute(route: FoundationViewState["activeRoute"]): void;
  begin(): void;
  receiveStatus(status: FoundationStatus): void;
  receiveEcho(echo: FoundationEchoResponse): void;
  fail(error: TypedError): void;
}

export const foundationStore = createStore<FoundationViewState>()((set) => ({
  activeRoute: "canary",
  status: null,
  echo: null,
  loading: false,
  error: null,
  setRoute: (activeRoute) => set({ activeRoute }),
  begin: () => set({ loading: true, error: null }),
  receiveStatus: (status) => set({ status, loading: false, error: null }),
  receiveEcho: (echo) => set({ echo, loading: false, error: null }),
  fail: (error) => set({ error, loading: false }),
}));
