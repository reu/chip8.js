describe("Chip8.Keyboard", function() {
  var keyboard, context;

  beforeEach(function() {
    keyboard = new Chip8.Keyboard;
  });

  describe("#isKeyPressed(keyCode)", function(){
    var keyCode = 10;

    // Simulate a browser key event
    var event = { which: keyCode };

    it("is true when a key is still pressed", function() {
      keyboard.keyDown(event);
      expect(keyboard.isKeyPressed(keyCode)).to.be(true);
    });

    it("is false when the key is released", function() {
      keyboard.keyDown(event);
      keyboard.keyUp(event);
      expect(keyboard.isKeyPressed(keyCode)).to.be(false);
    });

    it("is false when the key was not pressed", function() {
      expect(keyboard.isKeyPressed(keyCode)).to.be(false);
    });
  });

  describe("#onKeyPress", function() {
    it("triggers when the user press any key", function(done) {
      keyboard.onKeyPress = done;
      triggerKeyboardEvent(document.body, 30);
    });
  });
});
