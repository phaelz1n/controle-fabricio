import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PrivateLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 print:bg-white print:text-black">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden"><Header /></div>
        <main className="flex-1 p-6 overflow-auto print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrivateLayout;
