document.querySelectorAll('.drawingCanvas').forEach(canvas => {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  // Resize canvas to full screen
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
  }

  window.addEventListener('resize', resizeCanvas);

  // Initialize Canvas
  function initCanvas() {
    resizeCanvas();
  }

  initCanvas(); // Call it directly instead of using window.onload

  // Mouse Events
  canvas.addEventListener('mousedown', (e) => startDrawing(e.clientX, e.clientY));
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  canvas.addEventListener('mousemove', (e) => draw(e.clientX, e.clientY));

  // Touch Events
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  });

  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchcancel', stopDrawing);
  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
    e.preventDefault();
  });

  function startDrawing(x, y) {
    drawing = true;
    draw(x, y);
  }

  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(x, y) {
    if (!drawing) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  // Clear Canvas
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Add clearCanvas to the canvas element
  canvas.clearCanvas = clearCanvas;

});