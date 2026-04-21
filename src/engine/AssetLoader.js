// Loads and caches images and JSON data.
// Images that fail to load get a coloured placeholder drawn on an OffscreenCanvas.

export class AssetLoader {
  constructor() {
    this._images = {};
    this._json   = {};
  }

  // Fetch JSON from url, cache, and return the parsed object.
  async loadJSON(url) {
    if (this._json[url]) return this._json[url];
    const res  = await fetch(url);
    const data = await res.json();
    this._json[url] = data;
    return data;
  }

  // Load an image. On error returns a coloured placeholder.
  loadImage(url, fallbackColor = '#888') {
    if (this._images[url]) return Promise.resolve(this._images[url]);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this._images[url] = img;
        resolve(img);
      };
      img.onerror = () => {
        const canvas = this._makePlaceholder(fallbackColor);
        this._images[url] = canvas;
        resolve(canvas);
      };
      img.src = url;
    });
  }

  // Pre-load all sprite images referenced by a character definition.
  async loadCharacterSprites(charData, basePath) {
    const imgs = {};
    for (const [key, filename] of Object.entries(charData.sprites)) {
      imgs[key] = await this.loadImage(
        `${basePath}/${filename}`,
        charData.color || '#888',
      );
    }
    return imgs;
  }

  // Returns a cached image/canvas or null.
  get(url) { return this._images[url] || null; }

  _makePlaceholder(color) {
    const W = 80, H = 160;
    const c = document.createElement('canvas');
    c.width  = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(W * 0.25, H * 0.2, W * 0.5, H * 0.55);

    // Head
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.12, W * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.25, H * 0.2, W * 0.5, H * 0.55);

    return c;
  }
}
