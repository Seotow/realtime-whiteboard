import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { Dashboard } from '../components/Dashboard/Dashboard';

export const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};
