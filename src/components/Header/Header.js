import React from 'react';
import './header.less';

/**
 * Хедер приложения
 * @return {JSX.Element}
 * @constructor
 */
const Header = () => {
    return (
        <header className="header">
            <div className="header__container">
                <a className="header__logo" href="#">
                    ToDo
                </a>
            </div>
        </header>
    );
};

export default Header;