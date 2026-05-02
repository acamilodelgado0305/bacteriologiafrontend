const Placeholder = ({ titulo, icono = '🚧' }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-gray-800">{titulo}</h2>
    <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
      <span className="text-5xl mb-4">{icono}</span>
      <p className="font-medium text-gray-500">Módulo en desarrollo</p>
      <p className="text-sm mt-1">Este módulo se implementará en el siguiente sprint</p>
    </div>
  </div>
);

export default Placeholder;
