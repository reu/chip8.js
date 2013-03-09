describe("Chip8.VM", function() {
  var vm;

  beforeEach(function() {
    vm = new Chip8.VM;
  });

  it("has a program counter initialized with 0x200", function() {
    expect(vm).to.have.property("pc", 0x200);
  });

  it("has a stack", function() {
    expect(vm).to.have.property("stack");
  });

  it("has a screen", function() {
    expect(vm).to.have.property("screen");
  });

  describe("#memory", function() {
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
    it("decreases the delay timer when it is greater than zero", function() {
      vm.delayTimer = 2;
      vm.updateTimers();
      expect(vm.delayTimer).to.equal(1);
      vm.updateTimers();
      vm.updateTimers();
      vm.updateTimers();
      expect(vm.delayTimer).to.equal(0);
    });

    it("decreases the sound timer when it is greater than zero", function() {
      vm.soundTimer = 2;
      vm.updateTimers();
      expect(vm.soundTimer).to.equal(1);
      vm.updateTimers();
      vm.updateTimers();
      vm.updateTimers();
      expect(vm.soundTimer).to.equal(0);
    });
  });

  describe("#perform(opcode)", function() {
    // Shared examples
    var shouldIncrementProgramCounter = function(opcode) {
      it("increments the program counter by two", function() {
        vm.pc = 10;
        vm.perform(opcode);
        expect(vm.pc).to.equal(12);
      });
    }

    var shouldNotIncrementProgramCounter = function(opcode) {
      it("doesn't increment the program counter", function() {
        vm.pc = 10;
        vm.perform(opcode);
        expect(vm.pc).to.equal(10);
      });
    }

    context("0x00E0", function() {
      it("clears the screen", function(done) {
        vm.screen.clear = done;
        vm.perform(0x00E0);
      });

      shouldIncrementProgramCounter(0x00E0);
    });

    context("0x00EE returns from a subroutine", function() {
      it("sets the program counter to the stored stack pointer", function() {
        vm.stack = [10, 20, 30];
        vm.stackPointer = 2;
        vm.perform(0x00EE);
        expect(vm.pc).to.equal(20);
      });

      it("decrements the stack pointer", function() {
        vm.stackPointer = 2;
        vm.perform(0x00EE);
        expect(vm.stackPointer).to.equal(1);
      });
    });

    context("0x1NNN", function() {
      it("jumps to address NNN", function() {
        vm.perform(0x1445);
        expect(vm.pc).to.equal(0x0445);
      });
    });

    context("0x2NNN", function() {
      it("calls subroutine at NNN", function() {
        vm.perform(0x2678);
        expect(vm.pc).to.equal(0x0678);
      });

      it("stores the current program counter on the stack", function() {
        var currentPc = vm.pc = 10;
        vm.perform(0x2333);
        expect(vm.stack).to.contain(currentPc + 2);
      });

      it("increments the stack pointer", function() {
        var currentStackPointer = vm.stackPointer = 20;
        vm.perform(0x2333);
        expect(vm.stackPointer).to.equal(21);
      });
    });

    context("0x3XNN", function() {
      it("skips the next instruction if VX equals NN", function() {
        vm.pc = 10;
        vm.v[5] = 0x0003;
        vm.perform(0x3503);
        expect(vm.pc).to.equal(14);
      });

      it("runs the next instruction if VX doesn't equal NN", function() {
        vm.pc = 10;
        vm.v[5] = 0x0003;
        vm.perform(0x3504);
        expect(vm.pc).to.equal(12);
      });
    });

    context("0x4XNN", function() {
      it("skips the next instruction if VX doesn't equal NN", function() {
        vm.pc = 10;
        vm.v[5] = 0x0003;
        vm.perform(0x4504);
        expect(vm.pc).to.equal(14);
      });

      it("runs the next instruction if VX equals NN", function() {
        vm.pc = 10;
        vm.v[5] = 0x0003;
        vm.perform(0x4503);
        expect(vm.pc).to.equal(12);
      });
    });

    context("0x5XY0", function() {
      it("skips the next instruction if VX equals VY", function() {
        vm.pc = 10;
        vm.v[4] = 3;
        vm.v[5] = 3;
        vm.perform(0x5450);
        expect(vm.pc).to.equal(14);
      });

      it("runs the next instruction if VX equals VY", function() {
        vm.pc = 10;
        vm.v[4] = 3;
        vm.v[5] = 4;
        vm.perform(0x5450);
        expect(vm.pc).to.equal(12);
      });
    });

    context("0x6XNN", function() {
      it("sets VX to NN", function() {
        vm.perform(0x6321);
        expect(vm.v[3]).to.equal(0x0021);
      });

      shouldIncrementProgramCounter(0x6321);
    });

    context("0x7XNN", function() {
      it("adds NN to VX", function() {
        vm.v[5] = 0x0004;
        vm.perform(0x7505);
        expect(vm.v[5]).to.equal(0x0009);
      });

      shouldIncrementProgramCounter(0x7321);
    });

    context("0x8XY0", function() {
      it("sets VX to the value of VY", function() {
        var vx = vm.v[1] = 1;
        var vy = vm.v[2] = 2;

        vm.perform(0x8120);
        expect(vm.v[1]).to.equal(vy);
      });

      shouldIncrementProgramCounter(0x8120);
    });

    context("0x8XY1", function() {
      it("sets VX to VX or VY", function() {
        var vx, vy;

        vx = vm.v[1] = 0;
        vy = vm.v[2] = 2;
        vm.perform(0x8121);
        expect(vm.v[1]).to.equal(vy);

        vx = vm.v[1] = 3;
        vy = vm.v[2] = 2;
        vm.perform(0x8121);
        expect(vm.v[1]).to.equal(vx);
      });

      shouldIncrementProgramCounter(0x8001);
    });

    context("0x8XY2", function() {
      it("sets VX to VX and VY", function() {
        var vx = vm.v[1] = 0;
        var vy = vm.v[2] = 2;
        vm.perform(0x8122);
        expect(vm.v[1]).to.equal(0);

        vx = vm.v[1] = 2;
        vy = vm.v[2] = 2;
        vm.perform(0x8122);
        expect(vm.v[1]).to.equal(2);
      });

      shouldIncrementProgramCounter(0x8002);
    });

    context("0x8XY3", function() {
      it("sets VX to VX xor VY", function() {
        var vx, vy;

        vx = vm.v[1] = 1;
        vy = vm.v[2] = 1;
        vm.perform(0x8123);
        expect(vm.v[1]).to.equal(0);

        vx = vm.v[1] = 0;
        vy = vm.v[2] = 0;
        vm.perform(0x8123);
        expect(vm.v[1]).to.equal(0);

        vx = vm.v[1] = 1;
        vy = vm.v[2] = 0;
        vm.perform(0x8123);
        expect(vm.v[1]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8003);
    });

    context("0x8XY4", function() {
      it("adds VY to VX", function() {
        vm.v[1] = 3;
        vm.v[2] = 4;
        vm.perform(0x8124);
        expect(vm.v[1]).to.equal(7);
      });

      it("sets VF to 1 when there is a carry", function() {
        vm.v[1] = 0xFF;
        vm.v[2] = 0x01;
        vm.v[0xF] = 0;
        vm.perform(0x8124);
        expect(vm.v[1]).to.equal(0);
        expect(vm.v[0xF]).to.equal(1);
      });

      it("sets VF to 0 when there isn't a carry", function() {
        vm.v[1] = 0xFE;
        vm.v[2] = 0x01;
        vm.v[0xF] = 1;
        vm.perform(0x8124);
        expect(vm.v[1]).to.equal(0xFF);
        expect(vm.v[0xF]).to.equal(0);
      });

      shouldIncrementProgramCounter(0x8004);
    });

    context("0x8XY5", function() {
      it("subtracts VY from VX", function() {
        vm.v[1] = 5;
        vm.v[2] = 4;
        vm.perform(0x8125);
        expect(vm.v[1]).to.equal(1);
      });

      it("sets VF to 0 when there is a borrow", function() {
        vm.v[1] = 5;
        vm.v[2] = 6;
        vm.v[0xF] = 1;
        vm.perform(0x8125);
        expect(vm.v[1]).to.equal(0xFF);
        expect(vm.v[0xF]).to.equal(0);
      });

      it("sets VF to 1 when there isn't a borrow", function() {
        vm.v[1] = 5;
        vm.v[2] = 3;
        vm.v[0xF] = 0;
        vm.perform(0x8125);
        expect(vm.v[1]).to.equal(2);
        expect(vm.v[0xF]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8005);
    });

    context("0x8XY6", function() {
      it("shifts VX right by one", function() {
        vm.v[1] = 8;
        vm.perform(0x8116);
        expect(vm.v[1]).to.equal(4);
      });

      it("sets VF to the value of the least significant bit of VX before the shift", function() {
        vm.v[1] = 8;
        vm.v[0xF] = 1;
        vm.perform(0x8116);
        expect(vm.v[0xF]).to.equal(0);

        vm.v[1] = 9;
        vm.v[0xF] = 0;
        vm.perform(0x8116);
        expect(vm.v[0xF]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8006);
    });

    context("0x8XY7", function() {
      it("sets VX to VY minus VX", function() {
        vm.v[1] = 8;
        vm.v[2] = 10;
        vm.perform(0x8127);
        expect(vm.v[1]).to.equal(2);
      });

      it("sets VF to 0 when there is a borrow", function() {
        vm.v[1] = 11;
        vm.v[2] = 10;
        vm.v[0xF] = 1;
        vm.perform(0x8127);
        expect(vm.v[0xF]).to.equal(0);
        expect(vm.v[1]).to.equal(0xFF);
      });

      it("sets VF to 1 when there isn't a borrow", function() {
        vm.v[1] = 10;
        vm.v[2] = 10;
        vm.v[0xF] = 0;
        vm.perform(0x8127);
        expect(vm.v[0xF]).to.equal(1);
        expect(vm.v[1]).to.equal(0);
      });

      shouldIncrementProgramCounter(0x8127);
    });

    context("0x8XYE", function() {
      it("shifts VX left by one", function() {
        vm.v[1] = 8;
        vm.perform(0x811E);
        expect(vm.v[1]).to.equal(16);
      });

      it("sets VF to the value of the most significant bit of VX before the shift", function() {
        vm.v[1] = 0x08;
        vm.v[0xF] = 1;
        vm.perform(0x811E);
        expect(vm.v[0xF]).to.equal(0);

        vm.v[1] = 0x88;
        vm.v[0xF] = 0;
        vm.perform(0x811E);
        expect(vm.v[0xF]).to.equal(0x80);
      });

      shouldIncrementProgramCounter(0x800E);
    });

    context("0x9XY0", function() {
      it("skips the next instruction if VX doesn't equal VY", function() {
        vm.v[1] = 0;
        vm.v[2] = 1;
        vm.pc = 0;
        vm.perform(0x9120);
        expect(vm.pc).to.equal(4);

        vm.v[1] = 1;
        vm.v[2] = 1;
        vm.pc = 0;
        vm.perform(0x9120);
        expect(vm.pc).to.equal(2);
      });
    });

    context("0xANNN", function() {
      it("sets I to address NNN", function() {
        vm.perform(0xA123);
        expect(vm.i).to.equal(0x0123);
      });

      shouldIncrementProgramCounter(0xA123);
    });

    context("0xBNNN", function() {
      it("jumps to address NNN plus V0", function() {
        vm.v[0] = 0x01;
        vm.perform(0xB001);
        expect(vm.pc).to.equal(0x0002);
      });
    });

    context("0xCXNN", function() {
      var originalRandom;

      before(function() {
        var originalRandom = Math.random;
      });

      after(function() {
        Math.random = originalRandom;
      });

      it("sets VX to a random number and NN", function() {
        // Stubing out Math.random
        Math.random = function() { return 1 };

        vm.perform(0xC102);
        expect(vm.v[1]).to.equal(2);
      });

      shouldIncrementProgramCounter(0xC102);
    });

    context("0xDXYN", function() {
      it("draws a sprite at coordinate (VX, VY)");
      it("draws a sprite with width of 8 pixels");
      it("draws a sprite with height of N pixels");
      it("sets VF to 1 if any screen pixels are flipped from set to unset when the sprite is drawn");
      it("sets VF to 0 if none screen pixels are flipped from set to unset when the sprite is drawn");
    });

    context("0xEX9E", function() {
      it("skips the next instruction if the key stored in VX is pressed", function() {
        vm.pc = 0;
        vm.v[1] = 5;

        vm.input.isKeyPressed = function(key) {
          expect(key).to.equal(5);
          return true;
        }

        vm.perform(0xE19E);
        expect(vm.pc).to.equal(4);
      });

      it("doesn't skip the next instruction if the key stored in VX is not pressed", function() {
        vm.pc = 0;
        vm.v[2] = 6;

        vm.input.isKeyPressed = function(key) {
          expect(key).to.equal(6);
          return false;
        }

        vm.perform(0xE29E);
        expect(vm.pc).to.equal(2);
      });
    });

    context("0xEXA1", function() {
      it("skips the next instruction if the key stored in VX isn't pressed", function() {
        vm.pc = 0;
        vm.v[3] = 7;

        vm.input.isKeyPressed = function(key) {
          expect(key).to.equal(7);
          return false;
        }

        vm.perform(0xE3A1);
        expect(vm.pc).to.equal(4);
      });

      it("doesn't skip the next instruction if the key stored in VX is pressed", function() {
        vm.pc = 0;
        vm.v[4] = 8;

        vm.input.isKeyPressed = function(key) {
          expect(key).to.equal(8);
          return true;
        }

        vm.perform(0xE4A1);
        expect(vm.pc).to.equal(2);
      });
    });

    context("0xFX07", function() {
      it("sets VX to the value of the delay timer", function() {
        vm.delayTimer = 20;
        vm.perform(0xF207);
        expect(vm.v[2]).to.equal(20);
      });

      shouldIncrementProgramCounter(0xF207);
    });

    context("0xFX0A", function() {
      it("waits for a key press and the stores it in VX");
    });

    context("0xFX15", function() {
      it("sets the delay timer to VX", function() {
        vm.delayTimer = 0;
        vm.v[2] = 5;
        vm.perform(0xF215);
        expect(vm.delayTimer).to.equal(5);
      });

      shouldIncrementProgramCounter(0xF215);
    });

    context("0xFX18", function() {
      it("sets the sound timer to VX", function() {
        vm.soundTimer = 0;
        vm.v[3] = 6;
        vm.perform(0xF318);
        expect(vm.soundTimer).to.equal(6);
      });

      shouldIncrementProgramCounter(0xF318);
    });

    context("0xFX1E", function() {
      it("adds VX to I", function() {
        vm.i = 5;
        vm.v[1] = 3;
        vm.perform(0xF11E);
        expect(vm.i).to.equal(8);
      });

      shouldIncrementProgramCounter(0xF11E);
    });

    context("0xFX29", function() {
      it("sets the I to location of the sprite for the character in VX", function() {
        vm.v[1] = 1;
        vm.i = 0;
        vm.perform(0xF129);
        expect(vm.i).to.equal(5);
      });

      shouldIncrementProgramCounter(0xF129);
    });

    context("0xFX33", function() {
      it("stores the BCD representation of VX in memory starting at I", function() {
        vm.i = 0;
        vm.v[1] = 198;
        vm.perform(0xF133);
        expect(vm.memory[0]).to.equal(1);
        expect(vm.memory[1]).to.equal(9);
        expect(vm.memory[2]).to.equal(8);
      });

      shouldIncrementProgramCounter(0xF133);
    });

    context("0xFX55", function() {
      it("stores V0 to VX in memory starting at address I", function() {
        vm.v[0x0] = 0x00;
        vm.v[0x1] = 0x10;
        vm.v[0x2] = 0x20;
        vm.v[0x3] = 0x30;

        vm.i = 5;
        vm.perform(0xF355);

        expect(vm.memory[0x0 + 5]).to.equal(0x00);
        expect(vm.memory[0x1 + 5]).to.equal(0x10);
        expect(vm.memory[0x2 + 5]).to.equal(0x20);
        expect(vm.memory[0x3 + 5]).to.equal(0x30);
      });

      shouldIncrementProgramCounter(0xF355);
    });

    context("0xFX65", function() {
      it("fills V0 to VX with values from memory starting at address I", function() {
        vm.i = 6;

        vm.memory[6 + 0x0] = 0x00;
        vm.memory[6 + 0x1] = 0x10;
        vm.memory[6 + 0x2] = 0x20;
        vm.memory[6 + 0x3] = 0x30;

        vm.perform(0xF365);

        expect(vm.v[0x0]).to.equal(0x00);
        expect(vm.v[0x1]).to.equal(0x10);
        expect(vm.v[0x2]).to.equal(0x20);
        expect(vm.v[0x3]).to.equal(0x30);
      });

      shouldIncrementProgramCounter(0xF365);
    });
  });
});
