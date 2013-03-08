describe("Chip8.VM", function() {
  var vm;

  beforeEach(function() {
    vm = new Chip8.VM;
  });

  it("has a program counter", function() {
    expect(vm).to.have.property("pc");
  });

  it("has a stack", function() {
    expect(vm).to.have.property("stack");
  });

  it("has a screen", function() {
    expect(vm).to.have.property("screen");
  });

  describe("#memory", function() {
    it("is an array", function() {
      expect(vm.memory).to.be.an(Array);
    });

    it("has 4096 bytes", function() {
      expect(vm.memory).to.have.length(4096);
    });
  });

  it("has 16 8-bit data registers named from v0 to vF", function() {
    expect(vm).to.have.property("v");
    expect(vm.v).to.have.length(16);
    expect(vm.v.BYTES_PER_ELEMENT).to.equal(1);
  });

  it("has 16-bit address register named I", function() {
    expect(vm).to.have.property("i");
  });

  describe("timers", function() {
    it("has a delay timer", function() {
      expect(vm).to.have.property("delayTimer");
    });

    it("has a sound timer", function() {
      expect(vm).to.have.property("soundTimer");
    });
  });

  describe("#cycle", function() {
    it("performs the correct opcode", function(done) {
      vm.pc = 5;
      vm.memory[5] = 0xAA;
      vm.memory[6] = 0xBB;

      vm.perform = function(opcode) {
        expect(opcode).to.equal(0xAABB);
        done();
      }

      vm.cycle();
    });

    it("tries to render to the screen", function(done) {
      vm.render = done;
      vm.cycle();
    });

    it("update the timers", function(done) {
      vm.updateTimers = done;
      vm.cycle();
    });

    it("update the inputs state", function(done) {
      vm.updateInput = done;
      vm.cycle();
    });
  });

  describe("#updateTimers", function() {
    it("decreases the delay timer when it is greater than zero");
    it("decreases the sound timer when it is greater than zero");
  });

  describe("#perform(opcode)", function() {
    context("0x00E0", function() {
      it("clears the screen");
    });

    context("0x00EE returns from a subroutine", function() {
      it("sets the program counter to the stored stack pointer");
      it("decrements the stack pointer");
    });

    context("0x1NNN", function() {
      it("jumps to address NNN");
    });

    context("0x2NNN", function() {
      it("calls subroutine at NNN");
    });

    context("0x3XNN", function() {
      it("skips the next instruction if VX equals NN");
    });

    context("0x4XNN", function() {
      it("skips the next instruction if VX doesn't equal NN");
    });

    context("0x5XY0", function() {
      it("skips the next instruction if VX equals VY");
    });

    context("0x6XNN", function() {
      it("sets VX to NN");
    });

    context("0x7XNN", function() {
      it("adds NN to VX");
    });

    context("0x8XY0", function() {
      it("sets VX to the value of VY");
    });

    context("0x8XY1", function() {
      it("sets VX to VX or VY");
    });

    context("0x8XY2", function() {
      it("sets VX to VX and VY");
    });

    context("0x8XY3", function() {
      it("sets VX to VX xor VY");
    });

    context("0x8XY4", function() {
      it("adds VY to VX");
      it("sets VF to 1 when there is a carry");
      it("sets VF to 0 when there isn't a carry");
    });

    context("0x8XY5", function() {
      it("subtracts VY from VX");
      it("sets VF to 0 when there is a borrow");
      it("sets VF to 1 when there isn't a borrow");
    });

    context("0x8XY6", function() {
      it("shifts VX right by one");
      it("sets VF to the value of the least significant bit of VX before the shift");
    });

    context("0x8XY7", function() {
      it("sets VX to VY minus VX");
      it("sets VF to 0 when there is a borrow");
      it("sets VF to 1 when there isn't a borrow");
    });

    context("0x8XYE", function() {
      it("shifts VX left by one");
      it("sets VF to the value of the most significant bit of VX before the shift");
    });

    context("0x9XY0", function() {
      it("skips the next instruction if VX doesn't equal VY");
    });

    context("0xANNN", function() {
      it("sets I to address NNN");
    });

    context("0xBNNN", function() {
      it("jumps to address NNN plus V0");
    });

    context("0xCXNN", function() {
      it("sets VX to a random number and NN");
    });

    context("0xDXYN", function() {
      it("draws a sprite at coordinate (VX, VY)");
      it("draws a sprite with width of 8 pixels");
      it("draws a sprite with height of N pixels");
      it("sets VF to 1 if any screen pixels are flipped from set to unset when the sprite is drawn");
      it("sets VF to 0 if none screen pixels are flipped from set to unset when the sprite is drawn");
    });

    context("0xEX9E", function() {
      it("skips the next instruction if the key stored in VX is pressed");
    });

    context("0xEXA1", function() {
      it("skips the next instruction if the key stored in VX isn't pressed");
    });

    context("0xFX07", function() {
      it("sets VX to the value of the delay timer");
    });

    context("0xFX0A", function() {
      it("waits a key press and the stores it in VX");
    });

    context("0xFX15", function() {
      it("sets the delay timer to VX");
    });

    context("0xFX18", function() {
      it("sets the sound timer to VX");
    });

    context("0xFX1E", function() {
      it("adds VX to I");
    });

    context("0xFX29", function() {
      it("sets the I to location of the spirte for the character in VX");
    });

    context("0xFX33", function() {
    });

    context("0xFX55", function() {
      it("stores V0 to VX in memory starting at address I");
    });

    context("0xFX65", function() {
      it("fills V0 to VX with values from memory starting at address I");
    });
  });
});
