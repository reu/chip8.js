function triggerKeyboardEvent(element, keyCode) {
  var event = document.createEventObject ? document.createEventObject() : document.createEvent("Events");
  event.which = event.keyCode = keyCode;

  if (event.initEvent) {
    event.initEvent("keydown", true, true);
    element.dispatchEvent(event);
  } else {
    element.fireEvent("onkeydown", event);
  }
}
