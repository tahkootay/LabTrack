import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FileText, Activity, TestTube, Home, Upload } from 'lucide-react';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.nav`
  width: 250px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled.div`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const NavList = styled.ul`
  list-style: none;
`;

const NavItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.text.secondary};
  background-color: ${({ theme, $active }) => 
    $active ? `${theme.colors.primary}10` : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    text-decoration: none;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
`;

const navItems = [
  { path: '/', label: 'Результаты анализов', icon: Activity },
  { path: '/dashboard', label: 'Дашборд', icon: Home },
  { path: '/documents', label: 'Загрузить анализы', icon: FileText },
  { path: '/uploads', label: 'Мои загрузки', icon: Upload },
  { path: '/analytes', label: 'Показатели', icon: TestTube },
];


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <Container>
      <Sidebar>
        <Logo>
          <TestTube />
          LabTrack
        </Logo>
        
        <NavList>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavItem key={path}>
              <NavLink to={path} $active={location.pathname === path}>
                <Icon />
                {label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </Sidebar>
      
      <Main>
        {children}
      </Main>
    </Container>
  );
};

export default Layout;