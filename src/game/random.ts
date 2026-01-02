export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    if (typeof seed === "string") {
      this.state = 0;
      for (let i = 0; i < seed.length; i++) {
        this.state = (this.state << 5) - this.state + seed.charCodeAt(i);
        this.state |= 0;
      }
    } else {
      this.state = seed | 0;
    }
    // ensure non-zero
    if (this.state === 0) this.state = 1;
  }

  // xorshift32
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    // return positive float [0,1)
    return (x >>> 0) / 4294967296;
  }

  nextFloat(min = 0, max = 1): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    const r = this.next();
    return Math.floor(min + r * (max - min + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}
