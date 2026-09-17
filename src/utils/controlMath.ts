export const stepResponseFirstOrder = (
  t: number,
  K: number = 1,
  T: number = 1
): number => {
  return K * (1 - Math.exp(-t / T));
};

export const stepResponseSecondOrder = (
  t: number,
  wn: number = 1,
  zeta: number = 0.5,
  K: number = 1
): number => {
  if (zeta < 1) {
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    const phi = Math.acos(zeta);
    return (
      K *
      (1 -
        (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) *
          Math.sin(wd * t + phi))
    );
  } else if (zeta === 1) {
    return K * (1 - (1 + wn * t) * Math.exp(-wn * t));
  } else {
    const sqrtZ2m1 = Math.sqrt(zeta * zeta - 1);
    const p1 = (-zeta + sqrtZ2m1) * wn;
    const p2 = (-zeta - sqrtZ2m1) * wn;
    return (
      K *
      (1 + (p2 / (p1 - p2)) * Math.exp(p1 * t) + (p1 / (p2 - p1)) * Math.exp(p2 * t))
    );
  }
};

export const overshoot = (zeta: number): number => {
  if (zeta >= 1) return 0;
  return 100 * Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
};

export const settlingTime = (wn: number, zeta: number, band: number = 0.02): number => {
  if (zeta <= 0 || wn <= 0) return 0;
  return -Math.log(band * Math.sqrt(1 - zeta * zeta)) / (zeta * wn);
};

export const risingTime = (wn: number, zeta: number): number => {
  if (zeta >= 1) return 0;
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  const beta = Math.atan(Math.sqrt(1 - zeta * zeta) / zeta);
  return (Math.PI - beta) / wd;
};

export const bodeMagnitude = (
  omega: number,
  K: number = 10,
  T1: number = 0.5,
  T2: number = 0.1
): number => {
  const numerator = K;
  const denominator = Math.sqrt(
    Math.pow(1 - (omega * omega * T1 * T2), 2) + Math.pow(omega * T1 + omega * T2 * (1 - 0 * 1), 2)
  );
  const d2 =
    Math.sqrt(1 + (omega * T1) * (omega * T1)) *
    Math.sqrt(Math.pow(1 - omega * omega * T2 * T2, 2) + Math.pow(2 * 0.4 * omega * T2, 2));
  const ratio = numerator / d2;
  return 20 * Math.log10(Math.max(ratio, 1e-9));
};

export const bodePhase = (
  omega: number,
  K: number = 10,
  T1: number = 0.5,
  T2: number = 0.1
): number => {
  const p1 = -Math.atan(omega * T1);
  const denom = 1 - omega * omega * T2 * T2;
  const num2 = 2 * 0.4 * omega * T2;
  const p2 = -Math.atan2(num2, denom);
  return (p1 + p2) * (180 / Math.PI);
};

export const generateTimeSeries = (
  duration: number = 20,
  steps: number = 500
): number[] => {
  const arr: number[] = [];
  const dt = duration / steps;
  for (let i = 0; i <= steps; i++) {
    arr.push(i * dt);
  }
  return arr;
};

export const generateLogFreq = (
  wMin: number = 0.01,
  wMax: number = 100,
  steps: number = 400
): number[] => {
  const arr: number[] = [];
  const ratio = Math.pow(wMax / wMin, 1 / steps);
  let w = wMin;
  for (let i = 0; i <= steps; i++) {
    arr.push(w);
    w *= ratio;
  }
  return arr;
};
