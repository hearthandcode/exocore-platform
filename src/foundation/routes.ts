import type { FoundationStatus } from "./contracts";

export interface FoundationRoute {
  id: "foundation-status";
  label: "Foundation status";
  contract: "exocore.foundation-status.route.v1";
}

export function availableFoundationRoutes(
  status: FoundationStatus | null,
): FoundationRoute[] {
  return status?.skeleton_ui_enabled
    ? [
        {
          id: "foundation-status",
          label: "Foundation status",
          contract: "exocore.foundation-status.route.v1",
        },
      ]
    : [];
}
