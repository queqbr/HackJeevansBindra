let identification: any = null;
let resolver: ((v: any) => void) | null = null;
let recommendations: any = null;
let recommendationsResolver: ((v: any) => void) | null = null;

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

export function setRecommendations(res: any) {
  recommendations = res;
  if (recommendationsResolver) {
    recommendationsResolver(res);
    recommendationsResolver = null;
  }
}

export function getRecommendations() {
  return recommendations;
}

export function clearRecommendations() {
  recommendations = null;
  recommendationsResolver = null;
}

export function waitForRecommendations(): Promise<any> {
  if (recommendations) return Promise.resolve(recommendations);
  return new Promise((resolve) => {
    recommendationsResolver = resolve;
  });
}
