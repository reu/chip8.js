(function() {
  /**
   * A speaker used to emit sounds.
   *
   * @class Chip8.Speaker
   * @constructor
   */
  var Speaker = function Speaker() {
    var contextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext)
      , context
      , oscillator
      , gain;

    if (contextClass) {
      context = new contextClass();
      gain = context.createGain();
      gain.connect(context.destination);
    }

    /**
     * Play a triangle wave sound.
     * @method play
     * @param {Integer} frequency the frequency of the sound wave
     */
    this.play = function(frequency) {
      if (context && !oscillator) {
        oscillator = context.createOscillator();
        oscillator.frequency.value = frequency || 440;
        // Originally it would be a square wave, but
        // a triangle one sounds much better...
        oscillator.type = oscillator.TRIANGLE;
        oscillator.connect(gain);
        oscillator.start(0);
      }
    }

    /**
     * Stop the speaker.
     * @method stop
     */
    this.stop = function() {
      if (oscillator) {
        oscillator.stop(0);
        oscillator.disconnect(0);
        oscillator = null;
      }
    }

    /**
     * Clear the speaker state.
     * @method clear
     */
    this.clear = this.stop;
  }

  if (typeof module != "undefined") {
    module.exports = Speaker;
  } else {
    window.Chip8.Speaker = Speaker;
  }
})();
