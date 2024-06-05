class Noise {
  private readonly _chars: string[];

  constructor() {
    this._chars = [];
  }

  register(codePoint: number): void {
    this._chars.push(String.fromCharCode(codePoint));
  }

  registerRange(start: number, end: number): void {
    for (let codePoint = start; codePoint <= end; codePoint++) {
      this.register(codePoint);
    }
  }

  registerRanges(ranges: [number, number][]): void {
    for (const [start, end] of ranges) {
      this.registerRange(start, end);
    }
  }

  get chars(): string[] {
    return this._chars;
  }
}

export class Remover {
  private readonly _noise: string[];
  constructor() {
    const noise = new Noise();

    // KATAKANA MIDDLE DOT
    noise.register(0x30fb);

    // quotation
    noise.registerRange(0x2018, 0x201f);

    // kangxi
    noise.registerRange(0x2e80, 0x2ef3);

    // ASCII
    noise.registerRanges([
      [0x0021, 0x002f],
      [0x003a, 0x0040],
      [0x005b, 0x0060],
      [0x007b, 0x007e],
    ]);

    // horizontal bars
    noise.registerRanges([
      [0x2010, 0x2017],
      [0x2500, 0x2501],
      [0x2e3a, 0x2e3b],
    ]);

    // full width symbols
    noise.registerRanges([
      [0x25a0, 0x25ef],
      [0x3000, 0x3004],
      [0x3008, 0x3040],
      [0x3097, 0x30a0],
      [0x30fd, 0x30ff],
      [0xff01, 0xff0f],
      [0xff1a, 0xff20],
      [0xff3b, 0xff40],
      [0xff5b, 0xff65],
    ]);

    this._noise = noise.chars;
  }

  remove(s: string): string {
    this._noise.forEach((c) => {
      while (s.indexOf(c) != -1) {
        s = s.replace(c, ' ');
      }
    });
    return s.replace(/\s+/g, ' ');
  }
}
