import React from 'react';
import './layout.less';
import Header from "../Header/Header";

/**
 * Обертка контента страницы
 * @param children
 * @return {JSX.Element}
 * @constructor
 */
const Layout = ({children}) => {
    return (
        <div className="layout">
            <Header />
            <main className="layout__content">
                {children}
            </main>
        </div>
    );
};

export default Layout;