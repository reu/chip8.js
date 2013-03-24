(function() {
  /**
   * The CPU of the emulator, responsible for processing memory opcodes.
   *
   * @class Chip8.Screen
   * @constructor
   *
   * @property {Array} bitMap the display map
   */
  var Screen = function Screen() {
    this.rows = 32;
    this.columns = 64;
    this.resolution = this.rows * this.columns;
    this.bitMap = new Array(this.resolution);

    /**
     * Clear the bitMap.
     * @method clear
     */
    this.clear = function() {
      this.bitMap = new Array(this.resolution);
    }

    /**
     * @method setPixel
     * @param {Integer} x the starting x coordinate of the pixel
     * @param {Integer} y the starting y coordinate of the pixel
     */
    this.setPixel = function(x, y) {
      // Wrap around pixels that overflow the screen
      if (x > this.columns - 1) while (x > this.columns - 1) x -= this.columns;
      if (x < 0)                while (x < 0)                x += this.columns;

      if (y > this.rows - 1) while (y > this.rows - 1) y -= this.rows;
      if (y < 0)             while (y < 0)             y += this.rows;

      var location = x + (y * this.columns);
      this.bitMap[location] = this.bitMap[location] ^ 1;

      return !this.bitMap[location];
    }

    this.render = function(output) {}
  }

  /**
   * The CPU of the emulator, responsible for processing memory opcodes.
   *
   * @class Chip8.Screen.CanvasScreen
   * @extends Chip8.Screen
   * @constructor
   * @param {CanvasRenderingContext2D} ctx context 2D of a canvas element
   * @param {Integer} scale the scale of the rendering, defaults to 10.
   */
  Screen.CanvasScreen = function CanvasScreen(ctx, scale) {
    Screen.apply(this, arguments);

    this.scale = scale || 10;

    var width = ctx.canvas.width = this.columns * this.scale;
    var height = ctx.canvas.height = this.rows * this.scale;

    /**
     * Renders the bitMap array into the canvas context.
     * @method render
     */
    this.render = function() {
      var i, x, y;

      ctx.clearRect(0, 0, width, height);

      for (i = 0; i < this.resolution; i++) {
        x = (i % this.columns) * this.scale;
        y = Math.floor(i / this.columns) * this.scale;

        if (this.bitMap[i]) {
          ctx.fillStyle = "#000";
          ctx.fillRect(x, y, this.scale, this.scale);
        }
      }
    }
  }

  if (typeof module != "undefined") {
    module.exports = Screen;
  } else {
    window.Chip8.Screen = Screen;
  }
})();
