(function() {
  var VM = function VM() {
    this.pc = 0;
    this.stack = new Array;
    this.stackPointer = 0;
    this.screen = { clear: function() {} };
    this.v = new Int8Array(16);
    this.i = 0;
    this.memory = new Array(4096);
    this.delayTimer = 0;
    this.soundTimer = 0;

    this.cycle = function() {
      var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];

      this.perform(opcode);
      this.render();
      this.updateTimers();
      this.updateInput();
    }

    this.perform = function(opcode) {}
    this.render = function() {}
    this.updateTimers = function() {}
    this.updateInput = function() {}
  }

  module.exports = VM;
})();
