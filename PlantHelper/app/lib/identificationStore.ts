let identification: any = null;
let resolver: ((v: any) => void) | null = null;

export function setIdentification(res: any) {
  identification = res;
  if (resolver) {
    resolver(res);
    resolver = null;
  }
}

export function getIdentification() {
  return identification;
}

export function clearIdentification() {
  identification = null;
  resolver = null;
}

export function waitForIdentification(): Promise<any> {
  if (identification) return Promise.resolve(identification);
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

// Minimal default export so expo-router doesn't treat this helper as a broken route.
// This file is intended as a helper (use the named exports). The default export
// is just a no-op component to satisfy the router while keeping the helpers usable.
export default function _IdentificationStoreRoutePlaceholder(): null {
  return null;
}
