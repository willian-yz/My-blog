(function (global) {
  var SCRIPT_PATH = '/godot/slingshot/slingshot.js';
  var EXECUTABLE_PATH = '/godot/slingshot/slingshot';
  var MAIN_PACK_PATH = '/godot/slingshot/slingshot.pck';
  var engineScriptPromise = null;

  function ensureEngineScriptLoaded() {
    if (global.Engine) return Promise.resolve();
    if (engineScriptPromise) return engineScriptPromise;

    engineScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = SCRIPT_PATH;
      script.async = true;
      script.onload = function () {
        if (global.Engine) resolve();
        else reject(new Error('Godot Engine class missing after script load'));
      };
      script.onerror = function () {
        reject(new Error('Failed to load Godot export script: ' + SCRIPT_PATH));
      };
      document.head.appendChild(script);
    });

    return engineScriptPromise;
  }

  global.startSlingshotGodot = function startSlingshotGodot(container) {
    if (!container) return null;

    var canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(canvas);

    return ensureEngineScriptLoaded().then(function () {
      var engine = new global.Engine({
        canvas: canvas,
        executable: EXECUTABLE_PATH,
        mainPack: MAIN_PACK_PATH
      });
      return engine.startGame();
    });
  };
})(window);
