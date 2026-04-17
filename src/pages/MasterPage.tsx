import React from 'react';
import { ItemMaster } from '../components/ItemMaster';
import { useNavigate } from 'react-router-dom';

const MasterPage: React.FC = () => {
  const navigate = useNavigate();
  return <ItemMaster onBack={() => navigate('/')} />;
};

export default MasterPage;
