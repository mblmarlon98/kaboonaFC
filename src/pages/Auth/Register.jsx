import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * Register page - redirects to appropriate signup flow
 * - Default (player): /training-signup (full 5-step wizard)
 * - Fan: /login?mode=fan (simplified form)
 */
function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  // Fan signup goes to simplified form
  if (role === 'fan') {
    return <Navigate to="/login?mode=fan" replace />;
  }

  // Default to player training signup (5-step wizard)
  return <Navigate to="/training-signup" replace />;
}

export default Register;
