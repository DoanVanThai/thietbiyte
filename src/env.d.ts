/// <reference types="astro/client" />

import type { AuthPrincipal } from "@/server/auth/permissions";

declare global {
  namespace App {
    interface Locals {
      auth: AuthPrincipal | null;
    }
  }
}

export {};

