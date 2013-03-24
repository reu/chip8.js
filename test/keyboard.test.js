describe("Chip8.Keyboard", function() {
  var keyboard, context;

  var KEY_Q = 81;
  var CHIP8_KEY_4 = 0x4;

  beforeEach(function() {
    keyboard = new Chip8.Keyboard;
  });

  afterEach(function() {
    window.removeEventListener("keydown", keyboard.keyDown);
    window.removeEventListener("keyup", keyboard.keyDown);
  });

  describe("#isKeyPressed(keyCode)", function(){
    it("is true when a key is still pressed", function() {
      triggerKeyDown(document, KEY_Q);
      expect(keyboard.isKeyPressed(CHIP8_KEY_4)).to.be(true);
    });

    it("is false when the key is released", function() {
      triggerKeyDown(document, KEY_Q);
      triggerKeyUp(document, KEY_Q);
      expect(keyboard.isKeyPressed(CHIP8_KEY_4)).to.be(false);
    });

    it("is false when the key was not pressed", function() {
      expect(keyboard.isKeyPressed(CHIP8_KEY_4)).to.be(false);
    });
  });

  describe("#onNextKeyPress", function() {
    it("triggers when the user press any key", function(done) {
      keyboard.onNextKeyPress = function(keyCode) {
        expect(keyCode).to.be(CHIP8_KEY_4);
        done();
      }
      triggerKeyDown(document, KEY_Q);
    });

    it("clears after the event was handled", function(done) {
      var calls = 0;

      keyboard.onNextKeyPress = function(keyCode) {
        calls += 1;
      }

      triggerKeyDown(document, KEY_Q);
      triggerKeyDown(document, KEY_Q);
      triggerKeyDown(document, KEY_Q);

      setTimeout(function() {
        expect(calls).to.equal(1);
        done();
      }, 1);
    });
  });

  describe("#clear", function() {
    it("clears all the keys that are pressed", function() {
      triggerKeyDown(document, KEY_Q);
      expect(keyboard.isKeyPressed(CHIP8_KEY_4)).to.be(true);
      keyboard.clear();
      expect(keyboard.isKeyPressed(CHIP8_KEY_4)).to.be(false);
    });

    it("clears onNextKeyPress event handlers", function(done) {
      var calls = 0;

      keyboard.onNextKeyPress = function(keyCode) {
        calls += 1;
      }

      keyboard.clear();

      triggerKeyDown(document, KEY_Q);

      setTimeout(function() {
        expect(calls).to.equal(0);
        done();
      }, 1);
    });
  });
});
