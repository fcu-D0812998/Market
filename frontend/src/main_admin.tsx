import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { HashRouter } from 'react-router-dom';

import './index.css';
import AdminApp from './AdminApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhTW}>
      <HashRouter>
        <AdminApp />
      </HashRouter>
    </ConfigProvider>
  </StrictMode>,
);


