(function() {
  /**
   * The CPU of the emulator, responsible for processing memory opcodes.
   *
   * @class Chip8.CPU
   * @constructor
   */
  var CPU = function CPU() {
    this.pc = 0x200;
    this.stack = new Array;
    this.screen = { clear: function() {}, render: function() {}, setPixel: function() {} };
    this.input = { isKeyPressed: function(key) {}, clear: function() {} };
    this.v = new Uint8Array(16);
    this.i = 0;
    this.memory = new Uint8Array(4096);
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.paused = false;
    this.speed = 10;

    /**
     * Loads the CHIP8 fonts into memory.
     * Detailed information can be found at: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#font
     * @method loadFonts
     * @private
     */
    this.loadFonts = function() {
      var fonts = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
      ];

      for (var i = 0, length = fonts.length; i < length; i++) {
        this.memory[i] = fonts[i];
      }
    }

    /**
     * Reset the CPU with the default values.
     * @method reset
     */
    this.reset = function() {
      this.pc = 0x200;
      this.stack = new Array;
      this.v = new Uint8Array(16);
      this.i = 0;
      this.memory = new Uint8Array(4096);
      this.delayTimer = 0;
      this.soundTimer = 0;
      this.screen.clear();
      this.input.clear();
      this.loadFonts();
      this.paused = false;
    }

    /**
     * Loads a program into the memory.
     * @method loadProgram
     * @param {Array} program array of bytes of a CHIP8 program
     */
    this.loadProgram = function(program) {
      for (var i = 0, length = program.length; i < length; i++) {
        this.memory[0x200 + i] = program[i];
      }
    }

    /**
     * The main CPU cycle.
     * @method cycle
     */
    this.cycle = function() {
      for (var i = 0; i < this.speed; i++) {
        if (!this.paused) {
          var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
          this.perform(opcode);
          this.updateTimers();
        }
      }

      this.render();
    }

    /**
     * Process a given opcode.
     * @method perform
     * @param {Integer} opcode
     */
    this.perform = function(opcode) {
      this.pc += 2;

      var x = (opcode & 0x0F00) >> 8;
      var y = (opcode & 0x00F0) >> 4;

      switch (opcode & 0xF000) {
        case 0x000:
          switch(opcode) {
            // 00E0 - CLS
            // Clear the display.
            case 0x00E0:
              this.screen.clear();
              break;

            // 00EE - RET
            // Return from a subroutine.
            // The interpreter sets the program counter to the address at the
            //   top of the stack, then subtracts 1 from the stack pointer.
            case 0x00EE:
              this.pc = this.stack.pop();
              break;
          }
          break;

        // 1nnn - JP addr
        // Jump to location nnn.
        // The interpreter sets the program counter to nnn.
        case 0x1000:
          this.pc = opcode & 0x0FFF;
          break;

        // 2nnn - CALL addr
        // Call subroutine at nnn.
        // The interpreter increments the stack pointer, then puts the current
        //   PC on the top of the stack. The PC is then set to nnn.
        case 0x2000:
          this.stack.push(this.pc);
          this.pc = opcode & 0x0FFF;
          break;

        // 3xkk - SE Vx, byte
        // Skip next instruction if Vx = kk.
        // The interpreter compares register Vx to kk, and if they are equal,
        //   increments the program counter by 2.
        case 0x3000:
          if (this.v[x] == (opcode & 0x00FF)) {
            this.pc += 2;
          }
          break;

        // 4xkk - SNE Vx, byte
        // Skip next instruction if Vx != kk.
        // The interpreter compares register Vx to kk, and if they are not
        //   equal, increments the program counter by 2.
        case 0x4000:
          if (this.v[x] != (opcode & 0x00FF)) {
            this.pc += 2;
          }
          break;

        // 5xy0 - SE Vx, Vy
        // Skip next instruction if Vx = Vy.
        // The interpreter compares register Vx to register Vy, and if they are
        //   equal, increments the program counter by 2.
        case 0x5000:
          if (this.v[x] == this.v[y]) {
            this.pc += 2;
          }
          break;

        // 6xkk - LD Vx, byte
        // Set Vx = kk.
        // The interpreter puts the value kk into register Vx.
        case 0x6000:
          this.v[x] = opcode & 0x00FF;
          break;

        // 7xkk - ADD Vx, byte
        // Set Vx = Vx + kk.
        // Adds the value kk to the value of register Vx, then stores the
        //   result in Vx.
        case 0x7000:
          this.v[x] += opcode & 0x00FF;
          break;

        case 0x8000:
          switch (opcode & 0x000F) {
            // 8xy0 - LD Vx, Vy
            // Set Vx = Vy.
            // Stores the value of register Vy in register Vx.
            case 0x0000:
              this.v[x] = this.v[y];
              break;

            // 8xy1 - OR Vx, Vy
            // Set Vx = Vx OR Vy.
            // Performs a bitwise OR on the values of Vx and Vy, then stores the
            //   result in Vx. A bitwise OR compares the corrseponding
            //   bits from two values, and if either bit is 1, then the same bit
            //   in the result is also 1. Otherwise, it is 0.
            case 0x0001:
              this.v[x] = this.v[x] | this.v[y];
              break;

            // 8xy2 - AND Vx, Vy
            // Set Vx = Vx AND Vy.
            // Performs a bitwise AND on the values of Vx and Vy, then stores
            //   the result in Vx. A bitwise AND compares the corrseponding
            //   bits from two values, and if both bits are 1, then the same
            //   bit in the result is also 1. Otherwise, it is 0.
            case 0x0002:
              this.v[x] = this.v[x] & this.v[y];
              break;

            // 8xy3 - XOR Vx, Vy
            // Set Vx = Vx XOR Vy.
            // Performs a bitwise exclusive OR on the values of Vx and Vy, then
            //   stores the result in Vx. An exclusive OR compares the
            //   corrseponding bits from two values, and if the bits are not
            //   both the same, then the corresponding bit in the result is set
            //   to 1. Otherwise, it is 0.
            case 0x0003:
              this.v[x] = this.v[x] ^ this.v[y];
              break;

            // 8xy4 - ADD Vx, Vy
            // Set Vx = Vx + Vy, set VF = carry.
            // The values of Vx and Vy are added together. If the result is
            //   greater than 8 bits (i.e., > 255,) VF is set to 1,
            //   otherwise 0. Only the lowest 8 bits of the result are kept,
            //   and stored in Vx.
            case 0x0004:
              var sum = this.v[x] + this.v[y];

              if (sum > 0xFF) {
                this.v[0xF] = 1;
              } else {
                this.v[0xF] = 0;
              }

              this.v[x] = sum;
              break;

            // 8xy5 - SUB Vx, Vy
            // Set Vx = Vx - Vy, set VF = NOT borrow.
            // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is
            //   subtracted from Vx, and the results stored in Vx.
            case 0x0005:
              if(this.v[x] > this.v[y]) {
                this.v[0xF] = 1;
              } else {
                this.v[0xF] = 0;
              }

              this.v[x] = this.v[x] - this.v[y];
              break;

            // 8xy6 - SHR Vx {, Vy}
            // Set Vx = Vx SHR 1.
            // If the least-significant bit of Vx is 1, then VF is set to 1,
            //   otherwise 0. Then Vx is divided by 2.
            case 0x0006:
              this.v[0xF] = this.v[x] & 0x01;
              this.v[x] = this.v[x] >> 1;
              break;

            // 8xy7 - SUBN Vx, Vy
            // Set Vx = Vy - Vx, set VF = NOT borrow.
            // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is
            //   subtracted from Vy, and the results stored in Vx.
            case 0x0007:
              if (this.v[x] > this.v[y]) {
                this.v[0xF] = 0;
              } else {
                this.v[0xF] = 1;
              }

              this.v[x] = this.v[y] - this.v[x];
              break;

            // 8xyE - SHL Vx {, Vy}
            // Set Vx = Vx SHL 1.
            // If the most-significant bit of Vx is 1, then VF is set to 1,
            //   otherwise to 0. Then Vx is multiplied by 2.
            case 0x000E:
              this.v[0xF] = this.v[x] & 0x80;
              this.v[x] = this.v[x] << 1;
              break;
          }
          break;

        // 9xy0 - SNE Vx, Vy
        // Skip next instruction if Vx != Vy.
        // The values of Vx and Vy are compared, and if they are not equal, the
        //   program counter is increased by 2.
        case 0x9000:
          if (this.v[x] != this.v[y]) this.pc += 2;
          break;

        // Annn - LD I, addr
        // Set I = nnn.
        // The value of register I is set to nnn.
        case 0xA000:
          this.i = opcode & 0x0FFF;
          break;

        // Bnnn - JP V0, addr
        // Jump to location nnn + V0.
        // The program counter is set to nnn plus the value of V0.
        case 0xB000:
          this.pc = (opcode & 0x0FFF) + this.v[0];
          break;

        // Cxkk - RND Vx, byte
        // Set Vx = random byte AND kk.
        // The interpreter generates a random number from 0 to 255, which is
        //   then ANDed with the value kk. The results are stored in Vx. See
        //   instruction 8xy2 for more information on AND.
        case 0xC000:
          this.v[x] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);
          break;

        // Dxyn - DRW Vx, Vy, nibble
        // Display n-byte sprite starting at memory location I at (Vx, Vy),
        //   set VF = collision.
        case 0xD000:
          var row, col, sprite
            , width = 8
            , height = opcode & 0x000F;

          this.v[0xF] = 0;

          for (row = 0; row < height; row++) {
            sprite = this.memory[this.i + row];

            for (col = 0; col < width; col++) {
              if ((sprite & 0x80) > 0) {
                if (this.screen.setPixel(this.v[x] + col, this.v[y] + row)) {
                  this.v[0xF] = 1;
                }
              }

              sprite = sprite << 1;
            }
          }

          break;

        case 0xE000:
          switch (opcode & 0x00FF) {
            // Ex9E - SKP Vx
            // Skip next instruction if key with the value of Vx is pressed.
            case 0x009E:
              if (this.input.isKeyPressed(this.v[x])) {
                this.pc += 2;
              }
              break;

            // ExA1 - SKNP Vx
            // Skip next instruction if key with the value of Vx is not pressed.
            case 0x00A1:
              if (!this.input.isKeyPressed(this.v[x])) {
                this.pc += 2;
              }
              break;
          }
          break;

        case 0xF000:
          switch (opcode & 0x00FF) {
            // Fx07 - LD Vx, DT
            // Set Vx = delay timer value.
            case 0x0007:
              this.v[x] = this.delayTimer;
              break;

            // Fx0A - LD Vx, K
            // Wait for a key press, store the value of the key in Vx.
            case 0x000A:
              this.paused = true;

              this.input.onNextKeyPress = function(key) {
                this.v[x] = key;
                this.paused = false;
              }.bind(this);

            // Fx15 - LD DT, Vx
            // Set delay timer = Vx.
            case 0x0015:
              this.delayTimer = this.v[x];
              break;

            // Fx18 - LD ST, Vx
            // Set sound timer = Vx.
            case 0x0018:
              this.soundTimer = this.v[x];
              break;

            // Fx29 - LD F, Vx
            // Set I = location of sprite for digit Vx.
            case 0x0029:
              this.i = this.v[x] * 5;
              break;

            // Fx33 - LD B, Vx
            // Store BCD representation of Vx in memory locations I,
            //   I+1, and I+2.
            case 0x0033:
              this.memory[this.i]     = parseInt(this.v[x] / 100);
              this.memory[this.i + 1] = parseInt(this.v[x] % 100 / 10);
              this.memory[this.i + 2] = this.v[x] % 10;
              break;

            // Fx55 - LD [I], Vx
            // Store registers V0 through Vx in memory starting at location I.
            case 0x0055:
              for (var i = 0; i <= x; i++) {
                this.memory[this.i + i] = this.v[i];
              }
              break;

            // Fx65 - LD Vx, [I]
            // Read registers V0 through Vx from memory starting at location I.
            case 0x0065:
              for (var i = 0; i <= x; i++) {
                this.v[i] = this.memory[this.i + i];
              }
              break;

            // Fx1E - ADD I, Vx
            // Set I = I + Vx.
            case 0x001E:
              this.i += this.v[x];
              break;
          }

          break;

        default:
          throw new Error("Unknow opcode " + opcode.toString(16) + " informed.");
      }
    }

    /**
     * Renders the screen.
     * @method render
     */
    this.render = function() {
      this.screen.render();
    }

    /**
     * Updates the CPU delay and sound timers.
     * More info at: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.5
     * @method updateTimers
     */
    this.updateTimers = function() {
      if (this.delayTimer > 0) this.delayTimer -= 1;
      if (this.soundTimer > 0) this.soundTimer -= 1;
    }
  }

  if (typeof module != "undefined") {
    module.exports = CPU;
  } else {
    window.Chip8.CPU = CPU;
  }
})();
