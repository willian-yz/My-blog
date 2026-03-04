(function() {
  function createCanvas(container) {
    if (!container) return null;
    var canvas = container.querySelector('canvas');
    if (canvas) return canvas;

    canvas = document.createElement('canvas');
    canvas.id = 'slingshot-godot-canvas';
    canvas.width = 960;
    canvas.height = 540;
    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  }

  function loadEngineScript() {
    return new Promise(function(resolve, reject) {
      if (typeof window.Engine === 'function') {
        resolve(window.Engine);
        return;
      }

      var existed = document.querySelector('script[data-slingshot-engine="1"]');
      if (existed) {
        existed.addEventListener('load', function() { resolve(window.Engine); }, { once: true });
        existed.addEventListener('error', reject, { once: true });
        return;
      }

      var script = document.createElement('script');
      script.src = '/godot/slingshot/slingshot.js';
      script.async = true;
      script.dataset.slingshotEngine = '1';
      script.onload = function() {
        if (typeof window.Engine === 'function') resolve(window.Engine);
        else reject(new Error('Godot Engine is unavailable'));
      };
      script.onerror = function() {
        reject(new Error('Failed to load /godot/slingshot/slingshot.js'));
      };
      document.body.appendChild(script);
    });
  }

  window.startSlingshotGodot = function(container) {
    var canvas = createCanvas(container);
    if (!canvas) return Promise.reject(new Error('Missing slingshot container'));

    return loadEngineScript().then(function(Engine) {
      var config = {
        args: [],
        canvas: canvas,
        executable: '/godot/slingshot/slingshot',
        mainPack: '/godot/slingshot/slingshot.pck'
      };
      var engine = new Engine(config);
      return Promise.resolve(engine.startGame({})).then(function() {
        return engine;
      });
    });
  };
})();
