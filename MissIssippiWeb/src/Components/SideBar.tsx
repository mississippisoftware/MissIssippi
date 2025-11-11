import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { FaBars, FaTools, FaTshirt } from 'react-icons/fa';
import { useState } from 'react';
import { HiOutlineViewList } from 'react-icons/hi';
import { AiOutlineScan } from 'react-icons/ai';
import { NavLink } from 'react-router-dom';

export default function MySidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Sidebar collapsed={collapsed} style={{ backgroundColor: '#f8f9fa', height: '100vh' }}>
            {!collapsed && (
                <div style={{ padding: '1rem' }}>
                    <img src="/Images/MissIssippiLogo.png" width="200" className="d-inline-block pe-3" alt="MissIssippiLogo" />
                </div>
            )}
            <div style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', }}
                onClick={() => setCollapsed(!collapsed)} >
                <FaBars />
            </div>
            <Menu>
                <SubMenu label="Inventory" icon={<FaTshirt size={20} color="#008080" />} defaultOpen={true} >
                    <MenuItem icon={<AiOutlineScan />} component={<NavLink to="/enterinventory" />} >Enter Inventory</MenuItem>
                    <MenuItem icon={<HiOutlineViewList />} component={<NavLink to="/viewinventory" />}>View Inventory</MenuItem>
                </SubMenu>
                <SubMenu label="Data Maintenance" icon={<FaTools size={15} color="#D4AF37" />} defaultOpen={true} component={<NavLink to="/datamaintenance" />}>
                </SubMenu>
            </Menu>
        </Sidebar>
    );
}