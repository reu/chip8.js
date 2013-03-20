(function() {
  var Keyboard = function Keyboard() {
    var keysPressed = [];

    this.onKeyPress = function() {}

    this.clear = function() {
      keysPressed = [];
      this.onKeyPress = function() {}
    }

    this.isKeyPressed = function(keyCode) {
      var key = Keyboard.MAPPING[keyCode];
      return !!keysPressed[key];
    }

    var self = this;

    this.keyDown = function(event) {
      var key = String.fromCharCode(event.which);
      keysPressed[key] = true;

      for (var property in Keyboard.MAPPING) {
        var keyCode = Keyboard.MAPPING[property];

        if (keyCode == key) {
          self.onKeyPress(keyCode);
        }
      }
    }

    this.keyUp = function(event) {
      var key = String.fromCharCode(event.which);
      keysPressed[key] = false;
    }

    window.addEventListener("keydown", this.keyDown, false);
    window.addEventListener("keyup", this.keyUp, false);
  }

  Keyboard.MAPPING = {
    0x1: "1",
    0x2: "2",
    0x3: "3",
    0xC: "4",
    0x4: "Q",
    0x5: "W",
    0x6: "E",
    0xD: "R",
    0x7: "A",
    0x8: "S",
    0x9: "D",
    0xE: "F",
    0xA: "Z",
    0x0: "X",
    0xB: "C",
    0xF: "V"
  }

  if (typeof module != "undefined") {
    module.exports = Keyboard;
  } else {
    window.Chip8.Keyboard = Keyboard;
  }
})();
