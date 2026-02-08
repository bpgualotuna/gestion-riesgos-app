
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

const AdminRedirect = () => {
    const { user, esDueñoProcesos, esSupervisorRiesgos } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'admin') {
        return <Navigate to={ROUTES.ADMINISTRACION} replace />;
    }

    // Todos los usuarios van a Estadísticas (Dashboard Supervisor)
    return <Navigate to={ROUTES.DASHBOARD_SUPERVISOR} replace />;
};

export default AdminRedirect;
