(function() {
  /**
   * The CHIP8 emulator class.
   *
   * @class Chip8
   * @constructor
   *
   * @property {Chip8.Screen} screen where the emulator will render the graphics
   * @property {Chip8.Input} input the input handler
   */
  var Chip8 = function Chip8() {
    var loop
      , step
      , counter = 0
      , self = this
      , vm = new Chip8.VM;

    /**
     * An emulation cycle step.
     * @private
     */
    step = function step() {
      vm.cycle();
      loop = requestAnimationFrame(step);
    }

    /**
     * Start the emulator main loop.
     * @method start
     */
    this.start = function() {
      loop = requestAnimationFrame(step);
    }

    /**
     * Stop the emulator main loop.
     * @method stop
     */
    this.stop = function() {
      cancelAnimationFrame(loop);
    }

    /**
     * Load a rom into the VM memory.
     * @method loadRom
     * @param {String, Chip8.ROMS} name of a rom
     */
    this.loadRom = function(name) {
      var request = new XMLHttpRequest;
      request.onload = function() {
        if (request.response) {
          vm.screen = self.screen;
          vm.input = self.input;
          self.stop();
          vm.reset();
          vm.loadProgram(new Uint8Array(request.response));
          self.start();
        }
      }
      request.open("GET", "roms/" + name, true);
      request.responseType = "arraybuffer";
      request.send();
    }
  }

  /**
   * List of known CHIP8 roms.
   * @property ROMS
   * @type Array
   * @static
   * @final
   */
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
