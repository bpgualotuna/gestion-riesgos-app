import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const DashboardPage = () => {
  return <Navigate to={ROUTES.DASHBOARD_SUPERVISOR} replace />;
};

export default DashboardPage;
