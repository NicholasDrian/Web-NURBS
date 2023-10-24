export const span = function(knots: number[], u: number, p: number): number {
  const n: number = knots.length - p - 2;
  let l: number = p;
  let h: number = n;
  let m: number;
  while (l < h) {
    m = Math.floor((l + h) / 2);
    if (u >= knots[m + 1]) l = m + 1;
    else h = m;
  }
  return l;
}

export const basisFuncs = function(knots: number[], u: number, p: number): number[] {
  const funcs: number[] = [1];
  const i = span(knots, u, p);
  const left = (i: number, j: number) => { return u - knots[i - j + 1]; };
  const right = (i: number, j: number) => { return knots[i + j] - u; };
  for (let j = 1; j <= p; j++) {
    let saved = 0;
    for (let r = 0; r < j; r++) {
      const temp = funcs[r] / (right(i, r + 1) + left(i, j - r));
      funcs[r] = saved + right(i, r + 1) * temp;
      saved = left(i, j - r) * temp;
    }
    funcs.push(saved);
  }
  return funcs;
}


export const genericKnotVector = function(pointCount: number, degree: number): number[] {
  const res: number[] = [];
  for (let i = 0; i <= degree; i++) res.push(0);
  for (let i = 1; i < pointCount - degree; i++)  res.push(i);
  for (let i = 0; i <= degree; i++) res.push(pointCount - degree);
  return res;
}
