describe("Chip8.CPU", function() {
  var cpu;

  beforeEach(function() {
    cpu = new Chip8.CPU;
  });

  it("has a program counter initialized with 0x200", function() {
    expect(cpu).to.have.property("pc", 0x200);
  });

  it("has a stack", function() {
    expect(cpu).to.have.property("stack");
  });

  it("has a screen", function() {
    expect(cpu).to.have.property("screen");
  });

  describe("#memory", function() {
    it("has 4096 bytes", function() {
      expect(cpu.memory).to.have.length(4096);
    });
  });

  it("has 16 8-bit data registers named from v0 to vF", function() {
    expect(cpu).to.have.property("v");
    expect(cpu.v).to.have.length(16);
    expect(cpu.v.BYTES_PER_ELEMENT).to.equal(1);
  });

  it("has 16-bit address register named I", function() {
    expect(cpu).to.have.property("i");
  });

  describe("timers", function() {
    it("has a delay timer", function() {
      expect(cpu).to.have.property("delayTimer");
    });

    it("has a sound timer", function() {
      expect(cpu).to.have.property("soundTimer");
    });
  });

  describe("#cycle", function() {
    beforeEach(function() {
      cpu.speed = 1;
    });

    it("performs speed times", function(done) {
      var times = 0;
      cpu.speed = 5;
      cpu.perform = function() {
        times += 1;
        if (times == 5) done();
      }
      cpu.cycle();
    });

    it("performs the correct opcode", function(done) {
      cpu.pc = 5;
      cpu.memory[5] = 0xAA;
      cpu.memory[6] = 0xBB;

      cpu.perform = function(opcode) {
        expect(opcode).to.equal(0xAABB);
        done();
      }

      cpu.cycle();
    });

    it("tries to render to the screen", function(done) {
      cpu.render = done;
      cpu.cycle();
    });

    it("update the timers", function(done) {
      cpu.updateTimers = done;
      cpu.cycle();
    });

    context("when paused", function() {
      beforeEach(function() {
        cpu.paused = true;
      });

      it("doesn't perform any opcode", function() {
        cpu.perform = function() { throw "Called" }
        expect(function() { cpu.cycle() }).to.not.throwException("Called");
      });

      it("doesn't update the timers", function() {
        cpu.updateTimers = function() { throw "Called" }
        expect(function() { cpu.cycle() }).to.not.throwException("Called");
      });

      it("renders to the screen", function(done) {
        cpu.render = done;
        cpu.cycle();
      });
    });
  });

  describe("#updateTimers", function() {
    it("decreases the delay timer when it is greater than zero", function() {
      cpu.delayTimer = 2;
      cpu.updateTimers();
      expect(cpu.delayTimer).to.equal(1);
      cpu.updateTimers();
      cpu.updateTimers();
      cpu.updateTimers();
      expect(cpu.delayTimer).to.equal(0);
    });

    it("decreases the sound timer when it is greater than zero", function() {
      cpu.soundTimer = 2;
      cpu.updateTimers();
      expect(cpu.soundTimer).to.equal(1);
      cpu.updateTimers();
      cpu.updateTimers();
      cpu.updateTimers();
      expect(cpu.soundTimer).to.equal(0);
    });
  });

  describe("#loadProgram", function() {
    it("loads the rom data into memory starting at address 0x200", function() {
      var rom = [1, 2, 3];
      cpu.loadProgram(rom);
      expect(cpu.memory[0x200]).to.equal(1);
      expect(cpu.memory[0x201]).to.equal(2);
      expect(cpu.memory[0x202]).to.equal(3);
    });
  });

  describe("#perform(opcode)", function() {
    // Shared examples
    var shouldIncrementProgramCounter = function(opcode) {
      it("increments the program counter by two", function() {
        cpu.pc = 10;
        cpu.perform(opcode);
        expect(cpu.pc).to.equal(12);
      });
    }

    var shouldNotIncrementProgramCounter = function(opcode) {
      it("doesn't increment the program counter", function() {
        cpu.pc = 10;
        cpu.perform(opcode);
        expect(cpu.pc).to.equal(10);
      });
    }

    context("0x00E0", function() {
      it("clears the screen", function(done) {
        cpu.screen.clear = done;
        cpu.perform(0x00E0);
      });

      shouldIncrementProgramCounter(0x00E0);
    });

    context("0x00EE returns from a subroutine", function() {
      it("sets the program counter to the stored stack", function() {
        cpu.stack = [10, 20, 30];
        cpu.perform(0x00EE);
        expect(cpu.pc).to.equal(30);
      });
    });

    context("0x1NNN", function() {
      it("jumps to address NNN", function() {
        cpu.perform(0x1445);
        expect(cpu.pc).to.equal(0x0445);
      });
    });

    context("0x2NNN", function() {
      it("calls subroutine at NNN", function() {
        cpu.perform(0x2678);
        expect(cpu.pc).to.equal(0x0678);
      });

      it("stores the current program counter on the stack", function() {
        var currentPc = cpu.pc = 10;
        cpu.perform(0x2333);
        expect(cpu.stack).to.contain(currentPc + 2);
      });
    });

    context("0x3XNN", function() {
      it("skips the next instruction if VX equals NN", function() {
        cpu.pc = 10;
        cpu.v[5] = 0x0003;
        cpu.perform(0x3503);
        expect(cpu.pc).to.equal(14);
      });

      it("runs the next instruction if VX doesn't equal NN", function() {
        cpu.pc = 10;
        cpu.v[5] = 0x0003;
        cpu.perform(0x3504);
        expect(cpu.pc).to.equal(12);
      });
    });

    context("0x4XNN", function() {
      it("skips the next instruction if VX doesn't equal NN", function() {
        cpu.pc = 10;
        cpu.v[5] = 0x0003;
        cpu.perform(0x4504);
        expect(cpu.pc).to.equal(14);
      });

      it("runs the next instruction if VX equals NN", function() {
        cpu.pc = 10;
        cpu.v[5] = 0x0003;
        cpu.perform(0x4503);
        expect(cpu.pc).to.equal(12);
      });
    });

    context("0x5XY0", function() {
      it("skips the next instruction if VX equals VY", function() {
        cpu.pc = 10;
        cpu.v[4] = 3;
        cpu.v[5] = 3;
        cpu.perform(0x5450);
        expect(cpu.pc).to.equal(14);
      });

      it("runs the next instruction if VX equals VY", function() {
        cpu.pc = 10;
        cpu.v[4] = 3;
        cpu.v[5] = 4;
        cpu.perform(0x5450);
        expect(cpu.pc).to.equal(12);
      });
    });

    context("0x6XNN", function() {
      it("sets VX to NN", function() {
        cpu.perform(0x6321);
        expect(cpu.v[3]).to.equal(0x0021);
      });

      shouldIncrementProgramCounter(0x6321);
    });

    context("0x7XNN", function() {
      it("adds NN to VX", function() {
        cpu.v[5] = 0x0004;
        cpu.perform(0x7505);
        expect(cpu.v[5]).to.equal(0x0009);
      });

      shouldIncrementProgramCounter(0x7321);
    });

    context("0x8XY0", function() {
      it("sets VX to the value of VY", function() {
        var vx = cpu.v[1] = 1;
        var vy = cpu.v[2] = 2;

        cpu.perform(0x8120);
        expect(cpu.v[1]).to.equal(vy);
      });

      shouldIncrementProgramCounter(0x8120);
    });

    context("0x8XY1", function() {
      it("sets VX to VX or VY", function() {
        var vx, vy;

        vx = cpu.v[1] = 0;
        vy = cpu.v[2] = 2;
        cpu.perform(0x8121);
        expect(cpu.v[1]).to.equal(vy);

        vx = cpu.v[1] = 3;
        vy = cpu.v[2] = 2;
        cpu.perform(0x8121);
        expect(cpu.v[1]).to.equal(vx);
      });

      shouldIncrementProgramCounter(0x8001);
    });

    context("0x8XY2", function() {
      it("sets VX to VX and VY", function() {
        var vx = cpu.v[1] = 0;
        var vy = cpu.v[2] = 2;
        cpu.perform(0x8122);
        expect(cpu.v[1]).to.equal(0);

        vx = cpu.v[1] = 2;
        vy = cpu.v[2] = 2;
        cpu.perform(0x8122);
        expect(cpu.v[1]).to.equal(2);
      });

      shouldIncrementProgramCounter(0x8002);
    });

    context("0x8XY3", function() {
      it("sets VX to VX xor VY", function() {
        var vx, vy;

        vx = cpu.v[1] = 1;
        vy = cpu.v[2] = 1;
        cpu.perform(0x8123);
        expect(cpu.v[1]).to.equal(0);

        vx = cpu.v[1] = 0;
        vy = cpu.v[2] = 0;
        cpu.perform(0x8123);
        expect(cpu.v[1]).to.equal(0);

        vx = cpu.v[1] = 1;
        vy = cpu.v[2] = 0;
        cpu.perform(0x8123);
        expect(cpu.v[1]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8003);
    });

    context("0x8XY4", function() {
      it("adds VY to VX", function() {
        cpu.v[1] = 3;
        cpu.v[2] = 4;
        cpu.perform(0x8124);
        expect(cpu.v[1]).to.equal(7);
      });

      it("sets VF to 1 when there is a carry", function() {
        cpu.v[1] = 0xFF;
        cpu.v[2] = 0x01;
        cpu.v[0xF] = 0;
        cpu.perform(0x8124);
        expect(cpu.v[1]).to.equal(0);
        expect(cpu.v[0xF]).to.equal(1);
      });

      it("sets VF to 0 when there isn't a carry", function() {
        cpu.v[1] = 0xFE;
        cpu.v[2] = 0x01;
        cpu.v[0xF] = 1;
        cpu.perform(0x8124);
        expect(cpu.v[1]).to.equal(0xFF);
        expect(cpu.v[0xF]).to.equal(0);
      });

      shouldIncrementProgramCounter(0x8004);
    });

    context("0x8XY5", function() {
      it("subtracts VY from VX", function() {
        cpu.v[1] = 5;
        cpu.v[2] = 4;
        cpu.perform(0x8125);
        expect(cpu.v[1]).to.equal(1);
      });

      it("sets VF to 0 when there is a borrow", function() {
        cpu.v[1] = 5;
        cpu.v[2] = 6;
        cpu.v[0xF] = 1;
        cpu.perform(0x8125);
        expect(cpu.v[1]).to.equal(0xFF);
        expect(cpu.v[0xF]).to.equal(0);
      });

      it("sets VF to 1 when there isn't a borrow", function() {
        cpu.v[1] = 5;
        cpu.v[2] = 3;
        cpu.v[0xF] = 0;
        cpu.perform(0x8125);
        expect(cpu.v[1]).to.equal(2);
        expect(cpu.v[0xF]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8005);
    });

    context("0x8XY6", function() {
      it("shifts VX right by one", function() {
        cpu.v[1] = 8;
        cpu.perform(0x8116);
        expect(cpu.v[1]).to.equal(4);
      });

      it("sets VF to the value of the least significant bit of VX before the shift", function() {
        cpu.v[1] = 8;
        cpu.v[0xF] = 1;
        cpu.perform(0x8116);
        expect(cpu.v[0xF]).to.equal(0);

        cpu.v[1] = 9;
        cpu.v[0xF] = 0;
        cpu.perform(0x8116);
        expect(cpu.v[0xF]).to.equal(1);
      });

      shouldIncrementProgramCounter(0x8006);
    });

    context("0x8XY7", function() {
      it("sets VX to VY minus VX", function() {
        cpu.v[1] = 8;
        cpu.v[2] = 10;
        cpu.perform(0x8127);
        expect(cpu.v[1]).to.equal(2);
      });

      it("sets VF to 0 when there is a borrow", function() {
        cpu.v[1] = 11;
        cpu.v[2] = 10;
        cpu.v[0xF] = 1;
        cpu.perform(0x8127);
        expect(cpu.v[0xF]).to.equal(0);
        expect(cpu.v[1]).to.equal(0xFF);
      });

      it("sets VF to 1 when there isn't a borrow", function() {
        cpu.v[1] = 10;
        cpu.v[2] = 10;
        cpu.v[0xF] = 0;
        cpu.perform(0x8127);
        expect(cpu.v[0xF]).to.equal(1);
        expect(cpu.v[1]).to.equal(0);
      });

      shouldIncrementProgramCounter(0x8127);
    });

    context("0x8XYE", function() {
      it("shifts VX left by one", function() {
        cpu.v[1] = 8;
        cpu.perform(0x811E);
        expect(cpu.v[1]).to.equal(16);
      });

      it("sets VF to the value of the most significant bit of VX before the shift", function() {
        cpu.v[1] = 0x08;
        cpu.v[0xF] = 1;
        cpu.perform(0x811E);
        expect(cpu.v[0xF]).to.equal(0);

        cpu.v[1] = 0x88;
        cpu.v[0xF] = 0;
        cpu.perform(0x811E);
        expect(cpu.v[0xF]).to.equal(0x80);
      });

      shouldIncrementProgramCounter(0x800E);
    });

    context("0x9XY0", function() {
      it("skips the next instruction if VX doesn't equal VY", function() {
        cpu.v[1] = 0;
        cpu.v[2] = 1;
        cpu.pc = 0;
        cpu.perform(0x9120);
        expect(cpu.pc).to.equal(4);

        cpu.v[1] = 1;
        cpu.v[2] = 1;
        cpu.pc = 0;
        cpu.perform(0x9120);
        expect(cpu.pc).to.equal(2);
      });
    });

    context("0xANNN", function() {
      it("sets I to address NNN", function() {
        cpu.perform(0xA123);
        expect(cpu.i).to.equal(0x0123);
      });

      shouldIncrementProgramCounter(0xA123);
    });

    context("0xBNNN", function() {
      it("jumps to address NNN plus V0", function() {
        cpu.v[0] = 0x01;
        cpu.perform(0xB001);
        expect(cpu.pc).to.equal(0x0002);
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

        cpu.perform(0xC102);
        expect(cpu.v[1]).to.equal(2);
      });

      shouldIncrementProgramCounter(0xC102);
    });

    context("0xDXYN", function() {
      beforeEach(function() {
        cpu.i = 0;

        for (var i = 0; i < 16; i++) {
          for (var j = 0; j < 16; j++) {
            cpu.memory[i + j] = 0x80;
          }
        }
      });

      it("draws a sprite at coordinate (VX, VY)", function(done) {
        var count = 0;

        cpu.screen.setPixel = function(x, y) {
          if (count == 0) {
            expect(x).to.equal(5);
            expect(y).to.equal(8);

            done();
            count++;
          }
        }

        cpu.v[1] = 5;
        cpu.v[2] = 8;

        cpu.perform(0xD122);
      });

      it("draws a sprite with width of 8 pixels", function() {
        var xs = [];

        cpu.screen.setPixel = function(x, y) {
          xs.push(x);

          if (xs.length == 8) {
            var width = xs[xs.length - 1] - xs[0];
            expect(width).to.equal(8);
            done();
          }
        }

        cpu.v[1] = 5;
        cpu.v[2] = 6;

        cpu.perform(0xD121);
      });

      it("draws a sprite with height of N pixels", function() {
        var ys = [];

        cpu.screen.setPixel = function(x, y) {
          ys.push(y);

          if (ys.length == 3 * 8) {
            var height = ys[ys.length - 1] - ys[0];
            expect(height).to.equal(3);
            done();
          }
        }

        cpu.v[1] = 5;
        cpu.v[2] = 6;

        cpu.perform(0xD123);
      });

      it("sets VF to 1 if any screen pixels are flipped from set to unset when the sprite is drawn", function() {
        cpu.screen.setPixel = function() { return true }
        cpu.perform(0xD121);
      });

      it("sets VF to 0 if no screen pixels are flipped from set to unset when the sprite is drawn", function() {
        cpu.screen.setPixel = function() { return false }
        cpu.perform(0xD121);
      });

      shouldIncrementProgramCounter(0xD121);
    });

    context("0xEX9E", function() {
      it("skips the next instruction if the key stored in VX is pressed", function() {
        cpu.pc = 0;
        cpu.v[1] = 5;

        cpu.input.isKeyPressed = function(key) {
          expect(key).to.equal(5);
          return true;
        }

        cpu.perform(0xE19E);
        expect(cpu.pc).to.equal(4);
      });

      it("doesn't skip the next instruction if the key stored in VX is not pressed", function() {
        cpu.pc = 0;
        cpu.v[2] = 6;

        cpu.input.isKeyPressed = function(key) {
          expect(key).to.equal(6);
          return false;
        }

        cpu.perform(0xE29E);
        expect(cpu.pc).to.equal(2);
      });
    });

    context("0xEXA1", function() {
      it("skips the next instruction if the key stored in VX isn't pressed", function() {
        cpu.pc = 0;
        cpu.v[3] = 7;

        cpu.input.isKeyPressed = function(key) {
          expect(key).to.equal(7);
          return false;
        }

        cpu.perform(0xE3A1);
        expect(cpu.pc).to.equal(4);
      });

      it("doesn't skip the next instruction if the key stored in VX is pressed", function() {
        cpu.pc = 0;
        cpu.v[4] = 8;

        cpu.input.isKeyPressed = function(key) {
          expect(key).to.equal(8);
          return true;
        }

        cpu.perform(0xE4A1);
        expect(cpu.pc).to.equal(2);
      });
    });

    context("0xFX07", function() {
      it("sets VX to the value of the delay timer", function() {
        cpu.delayTimer = 20;
        cpu.perform(0xF207);
        expect(cpu.v[2]).to.equal(20);
      });

      shouldIncrementProgramCounter(0xF207);
    });

    context("0xFX0A", function() {
      it("pauses the emulation until a key is pressed", function() {
        cpu.perform(0xF10A);
        expect(cpu.paused).to.be(true);
        cpu.input.onKeyPress(1);
        expect(cpu.paused).to.be(false);
      });

      it("stores the pressed key in VX", function() {
        cpu.perform(0xF10A);
        cpu.input.onKeyPress(5);
        expect(cpu.v[1]).to.equal(5);
      });
    });

    context("0xFX15", function() {
      it("sets the delay timer to VX", function() {
        cpu.delayTimer = 0;
        cpu.v[2] = 5;
        cpu.perform(0xF215);
        expect(cpu.delayTimer).to.equal(5);
      });

      shouldIncrementProgramCounter(0xF215);
    });

    context("0xFX18", function() {
      it("sets the sound timer to VX", function() {
        cpu.soundTimer = 0;
        cpu.v[3] = 6;
        cpu.perform(0xF318);
        expect(cpu.soundTimer).to.equal(6);
      });

      shouldIncrementProgramCounter(0xF318);
    });

    context("0xFX1E", function() {
      it("adds VX to I", function() {
        cpu.i = 5;
        cpu.v[1] = 3;
        cpu.perform(0xF11E);
        expect(cpu.i).to.equal(8);
      });

      shouldIncrementProgramCounter(0xF11E);
    });

    context("0xFX29", function() {
      it("sets the I to location of the sprite for the character in VX", function() {
        cpu.v[1] = 1;
        cpu.i = 0;
        cpu.perform(0xF129);
        expect(cpu.i).to.equal(5);
      });

      shouldIncrementProgramCounter(0xF129);
    });

    context("0xFX33", function() {
      it("stores the BCD representation of VX in memory starting at I", function() {
        cpu.i = 0;
        cpu.v[1] = 198;
        cpu.perform(0xF133);
        expect(cpu.memory[0]).to.equal(1);
        expect(cpu.memory[1]).to.equal(9);
        expect(cpu.memory[2]).to.equal(8);
      });

      shouldIncrementProgramCounter(0xF133);
    });

    context("0xFX55", function() {
      it("stores V0 to VX in memory starting at address I", function() {
        cpu.v[0x0] = 0x00;
        cpu.v[0x1] = 0x10;
        cpu.v[0x2] = 0x20;
        cpu.v[0x3] = 0x30;

        cpu.i = 5;
        cpu.perform(0xF355);

        expect(cpu.memory[0x0 + 5]).to.equal(0x00);
        expect(cpu.memory[0x1 + 5]).to.equal(0x10);
        expect(cpu.memory[0x2 + 5]).to.equal(0x20);
        expect(cpu.memory[0x3 + 5]).to.equal(0x30);
      });

      shouldIncrementProgramCounter(0xF355);
    });

    context("0xFX65", function() {
      it("fills V0 to VX with values from memory starting at address I", function() {
        cpu.i = 6;

        cpu.memory[6 + 0x0] = 0x00;
        cpu.memory[6 + 0x1] = 0x10;
        cpu.memory[6 + 0x2] = 0x20;
        cpu.memory[6 + 0x3] = 0x30;

        cpu.perform(0xF365);

        expect(cpu.v[0x0]).to.equal(0x00);
        expect(cpu.v[0x1]).to.equal(0x10);
        expect(cpu.v[0x2]).to.equal(0x20);
        expect(cpu.v[0x3]).to.equal(0x30);
      });

      shouldIncrementProgramCounter(0xF365);
    });
  });
});
