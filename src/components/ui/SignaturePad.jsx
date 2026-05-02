import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const SignaturePad = forwardRef(({ disabled = false, onFirma, ocultarConfirmar = false }, ref) => {
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [vacio, setVacio] = useState(true);
  const ultPos = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    limpiar: () => limpiar(),
    obtenerFirma: () => obtenerFirma(),
    estaVacio: () => vacio,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const iniciar = (e) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    ultPos.current = pos;
    setDibujando(true);
    setVacio(false);
  };

  const dibujar = (e) => {
    if (!dibujando || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(ultPos.current.x, ultPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ultPos.current = pos;
  };

  const terminar = (e) => {
    e?.preventDefault();
    setDibujando(false);
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  };

  const obtenerFirma = () => {
    if (vacio) return null;
    return canvasRef.current.toDataURL('image/png');
  };

  const confirmar = () => {
    const firma = obtenerFirma();
    if (firma && onFirma) onFirma(firma);
  };

  return (
    <div className="space-y-2">
      <div className={`relative rounded-xl border-2 ${disabled ? 'border-gray-100 bg-gray-50' : 'border-dashed border-gray-300 bg-white'} overflow-hidden`}>
        {vacio && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm select-none">✍️ Firma aquí</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-32 touch-none"
          style={{ cursor: disabled ? 'default' : 'crosshair' }}
          onMouseDown={iniciar}
          onMouseMove={dibujar}
          onMouseUp={terminar}
          onMouseLeave={terminar}
          onTouchStart={iniciar}
          onTouchMove={dibujar}
          onTouchEnd={terminar}
        />
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <button type="button" onClick={limpiar}
            className={`py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors ${ocultarConfirmar ? 'flex-none px-4' : 'flex-1'}`}>
            Limpiar
          </button>
          {!ocultarConfirmar && (
            <button type="button" onClick={confirmar} disabled={vacio}
              className="flex-1 py-2 text-sm bg-up-blue text-white rounded-lg hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Confirmar firma
            </button>
          )}
        </div>
      )}
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
