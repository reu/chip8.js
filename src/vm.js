(function() {
  var VM = function VM() {
    this.pc = 0x200;
    this.stack = new Array;
    this.stackPointer = 0;
    this.screen = { clear: function() {}, render: function() {}, setPixel: function() {} };
    this.input = { isKeyPressed: function(key) {} };
    this.v = new Uint8Array(16);
    this.i = 0;
    this.memory = new Uint8Array(4096);
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.paused = false;
    this.speed = 10;

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

    this.loadProgram = function(program) {
      for (var i = 0, length = program.length; i < length; i++) {
        this.memory[0x200 + i] = program[i];
      }
    }

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

    this.perform = function(opcode) {
      this.pc += 2;

      var x = (opcode & 0x0F00) >> 8;
      var y = (opcode & 0x00F0) >> 4;

      switch (opcode & 0xF000) {
        case 0x000:
          switch(opcode) {
            case 0x00E0:
              this.screen.clear();
              break;

            case 0x00EE:
              this.stackPointer -= 1;
              this.pc = this.stack[this.stackPointer];
              break;
          }
          break;

        case 0xA000:
          this.i = opcode & 0x0FFF;
          break;

        case 0xB000:
          this.pc = (opcode & 0x0FFF) + this.v[0];
          break;

        case 0x1000:
          this.pc = opcode & 0x0FFF;
          break;

        case 0x2000:
          this.stack[this.stackPointer] = this.pc;
          this.stackPointer += 1;
          this.pc = opcode & 0x0FFF;
          break;

        case 0x3000:
          if (this.v[x] == (opcode & 0x00FF)) {
            this.pc += 2;
          }
          break;

        case 0x4000:
          if (this.v[x] != (opcode & 0x00FF)) {
            this.pc += 2;
          }
          break;

        case 0x5000:
          if (this.v[x] == this.v[y]) {
            this.pc += 2;
          }
          break;

        case 0x6000:
          this.v[x] = opcode & 0x00FF;
          break;

        case 0x7000:
          this.v[x] += opcode & 0x00FF;
          break;

        case 0x8000:
          switch (opcode & 0x000F) {
            case 0x0000:
              this.v[x] = this.v[y];
              break;

            case 0x0001:
              this.v[x] = this.v[x] | this.v[y];
              break;

            case 0x0002:
              this.v[x] = this.v[x] & this.v[y];
              break;

            case 0x0003:
              this.v[x] = this.v[x] ^ this.v[y];
              break;

            case 0x0004:
              var sum = this.v[x] + this.v[y];

              if (sum > 0xFF) {
                this.v[0xF] = 1;
              } else {
                this.v[0xF] = 0;
              }

              this.v[x] = sum;
              break;

            case 0x0005:
              if(this.v[x] > this.v[y]) {
                this.v[0xF] = 1;
              } else {
                this.v[0xF] = 0;
              }

              this.v[x] = this.v[x] - this.v[y];
              break;

            case 0x0006:
              this.v[0xF] = this.v[x] & 0x01;
              this.v[x] = this.v[x] >> 1;
              break;

            case 0x0007:
              if (this.v[x] > this.v[y]) {
                this.v[0xF] = 0;
              } else {
                this.v[0xF] = 1;
              }

              this.v[x] = this.v[y] - this.v[x];
              break;

            case 0x000E:
              this.v[0xF] = this.v[x] & 0x80;
              this.v[x] = this.v[x] << 1;
              break;
          }
          break;

        case 0x9000:
          if (this.v[x] != this.v[y]) this.pc += 2;
          break;

        case 0xC000:
          this.v[x] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);
          break;

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
            case 0x009E:
              if (this.input.isKeyPressed(this.v[x])) {
                this.pc += 2;
              }
              break;

            case 0x00A1:
              if (!this.input.isKeyPressed(this.v[x])) {
                this.pc += 2;
              }
              break;
          }
          break;

        case 0xF000:
          switch (opcode & 0x00FF) {
            case 0x0007:
              this.v[x] = this.delayTimer;
              break;

            case 0x0015:
              this.delayTimer = this.v[x];
              break;

            case 0x0018:
              this.soundTimer = this.v[x];
              break;

            case 0x0029:
              this.i = this.v[x] * 5;
              break;

            case 0x0033:
              this.memory[this.i]     = parseInt(this.v[x] / 100);
              this.memory[this.i + 1] = parseInt(this.v[x] % 100 / 10);
              this.memory[this.i + 2] = this.v[x] % 10;
              break;

            case 0x0055:
              for (var i = 0; i <= x; i++) {
                this.memory[this.i + i] = this.v[i];
              }
              break;

            case 0x0065:
              for (var i = 0; i <= x; i++) {
                this.v[i] = this.memory[this.i + i];
              }
              break;

            case 0x001E:
              this.i += this.v[x];
              break;
          }

          break;

        default:
          throw new Error("Unknow opcode " + opcode.toString(16) + " informed.");
      }
    }

    this.render = function() {
      this.screen.render();
    }

    this.updateTimers = function() {
      if (this.delayTimer > 0) this.delayTimer -= 1;
      if (this.soundTimer > 0) this.soundTimer -= 1;
    }
  }

  module.exports = VM;
})();
