(function() {
  var Chip8 = function Chip8(renderingContext) {
    var loop
      , step
      , counter = 0
      , self = this
      , vm = new Chip8.VM;

    vm.screen = new Chip8.Screen.CanvasScreen(renderingContext);
    vm.input = new Chip8.Keyboard;

    step = function step() {
      vm.cycle();
      loop = requestAnimationFrame(step);
    }

    this.start = function() {
      loop = requestAnimationFrame(step);
    }

    this.stop = function() {
      cancelAnimationFrame(loop);
    }

    this.loadRom = function(name) {
      var request = new XMLHttpRequest;
      request.onload = function() {
        self.stop();
        vm.reset();
        vm.loadProgram(new Uint8Array(request.response));
        self.start();
      }
      request.responseType = "arraybuffer";
      request.open("GET", "roms/" + name, true);
      request.send();
    }
  }

  Chip8.ROMS = [
    "15PUZZLE",
    "BLINKY",
    "BLITZ",
    "BRIX",
    "CONNECT4",
    "GUESS",
    "HIDDEN",
    "IBM",
    "INVADERS",
    "KALEID",
    "MAZE",
    "MERLIN",
    "MISSILE",
    "PONG",
    "PONG2",
    "PUZZLE",
    "SYZYGY",
    "TANK",
    "TETRIS",
    "TICTAC",
    "UFO",
    "VBRIX",
    "VERS",
    "WIPEOFF"
  ];

  if (typeof module != "undefined") {
    Chip8.VM = require("./src/vm.js");
    Chip8.Keyboard = require("./src/keyboard.js");
    Chip8.Screen = require("./src/screen.js");

    module.exports = Chip8;
  } else {
    window.Chip8 = Chip8;
  }
})();
