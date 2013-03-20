(function() {
  var Screen = function Screen() {
    this.rows = 32;
    this.columns = 64;
    this.resolution = this.rows * this.columns;
    this.bitMap = new Array(this.resolution);

    this.clear = function() {
      this.bitMap = new Array(this.resolution);
    }

    this.setPixel = function(x, y) {
      // Wrap around pixels that overflow the screen
      if (x > this.columns) {
        x -= this.columns;
      } else if (x < 0) {
        x += this.columns;
      }

      if (y > this.rows) {
        y -= this.rows;
      } else if (y < 0) {
        y += this.rows;
      }

      var location = x + (y * this.columns);
      this.bitMap[location] = this.bitMap[location] ^ 1;

      return !this.bitMap[location];
    }

    this.render = function(output) {}
  }

  Screen.CanvasScreen = function CanvasScreen(ctx, scale) {
    Screen.apply(this, arguments);

    this.scale = scale || 10;

    var width = ctx.canvas.width = this.columns * this.scale;
    var height = ctx.canvas.height = this.rows * this.scale;

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
