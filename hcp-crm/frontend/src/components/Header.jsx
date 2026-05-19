import React from 'react';
import { Activity, Bell, Settings, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <Activity size={20} strokeWidth={2.5} />
          <span className="logo-text">LifeSync <span className="logo-crm">CRM</span></span>
        </div>
        <nav className="header-nav">
          <a href="#" className="nav-link active">HCP Module</a>
          <a href="#" className="nav-link">Analytics</a>
          <a href="#" className="nav-link">Territory</a>
          <a href="#" className="nav-link">Reports</a>
        </nav>
      </div>
      <div className="header-right">
        <button className="icon-btn"><Bell size={18} /></button>
        <button className="icon-btn"><Settings size={18} /></button>
        <div className="user-avatar">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
