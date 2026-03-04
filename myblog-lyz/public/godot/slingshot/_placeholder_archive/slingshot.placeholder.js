(function(global){
  function Engine(config) {
    this.config = config || {};
  }

  Engine.prototype.startGame = async function() {
    var canvas = this.config.canvas;
    var executable = this.config.executable || '/godot/slingshot/slingshot';
    var mainPack = this.config.mainPack || '/godot/slingshot/slingshot.pck';

    var wasmResp = await fetch(executable + '.wasm', { cache: 'no-store' });
    if (!wasmResp.ok) throw new Error('WASM load failed');

    var packResp = await fetch(mainPack, { cache: 'no-store' });
    if (!packResp.ok) throw new Error('PCK load failed');

    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f7f0e6';
        ctx.font = '24px sans-serif';
        ctx.fillText('Slingshot Godot Host Ready', 40, 70);
        ctx.font = '18px sans-serif';
        ctx.fillText('已加载占位资源，请替换为真实 Godot 导出文件。', 40, 110);
      }
    }
  };

  global.Engine = Engine;
})(window);
