import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoApp from '../../images/bact.jpeg';

const navItems = [
  { to: '/dashboard',     label: 'Inicio',               icon: '🏠', roles: ['admin', 'docente', 'estudiante', 'bacteriologo'] },
  { to: '/registros',     label: 'Registro Diario',      icon: '📋', roles: ['estudiante'] },
  { to: '/firmas',        label: 'Firmas pendientes',    icon: '✍️', roles: ['docente', 'bacteriologo'] },
  { to: '/estudiantes',   label: 'Estudiantes',          icon: '👨‍🎓', roles: ['admin', 'docente'] },
  { to: '/supervisores',  label: 'Supervisores',         icon: '👥', roles: ['admin'] },
  { to: '/entidades',     label: 'Entidades',            icon: '🏥', roles: ['admin', 'docente'] },
  { to: '/cierres',       label: 'Archivo Semestres',    icon: '🗄️', roles: ['admin', 'docente'] },
  { to: '/reportes',      label: 'Reportes',             icon: '📊', roles: ['admin', 'docente', 'bacteriologo', 'estudiante'] },
  { to: '/usuarios',      label: 'Usuarios',             icon: '👥', roles: ['admin'] },
];

const Sidebar = ({ abierto, onCerrar }) => {
  const { usuario } = useAuth();

  const tieneAcceso = (item) => {
    if (item.roles.includes(usuario?.rol)) return true;
    // Docente con esAdminDocente ve ítems de admin
    if (usuario?.esAdminDocente && item.roles.includes('admin')) return true;
    return false;
  };

  const itemsFiltrados = navItems.filter(tieneAcceso);

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onCerrar} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-up-blue text-white z-30
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${abierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <img src={logoApp} alt="Bacteriología UP" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-400" />
            <div>
              <h1 className="text-base font-bold leading-tight">Bacteriología UP</h1>
              <p className="text-blue-300 text-xs">Prácticas Formativas</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {itemsFiltrados.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <p className="text-sm font-medium text-white">{usuario?.nombre} {usuario?.apellido}</p>
          <p className="text-xs text-blue-300 capitalize">
            {usuario?.rol}{usuario?.esAdminDocente ? ' · Admin' : ''}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
