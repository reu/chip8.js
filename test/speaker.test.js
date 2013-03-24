describe("Chip8.Speaker", function() {
  var speaker;

  beforeEach(function() {
    speaker = new Chip8.Speaker;
  });

  describe("#play", function() {
    it("is a method", function() {
      expect(speaker.play).to.be.a("function");
    });
  });

  describe("#stop", function() {
    it("is a method", function() {
      expect(speaker.stop).to.be.a("function");
    });
  });
});
