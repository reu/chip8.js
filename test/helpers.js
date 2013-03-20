function triggerKeyDown(element, keyCode) {
  triggerKeyEvent("keydown", element, keyCode);
}

function triggerKeyUp(element, keyCode) {
  triggerKeyEvent("keyup", element, keyCode);
}

function triggerKeyEvent(name, element, keyCode) {
  var event = document.createEventObject ? document.createEventObject() : document.createEvent("Events");
  event.which = event.keyCode = keyCode;

  if (event.initEvent) {
    event.initEvent(name, true, true);
    element.dispatchEvent(event);
  } else {
    element.fireEvent("on" + name, event);
  }
}
