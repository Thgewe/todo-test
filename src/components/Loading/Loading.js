import React from 'react';
import './loading.less';


/**
 * Элемент показывающий, что идет загрузка.
 * @return {JSX.Element}
 * @constructor
 */
const Loading = () => {
    return (
        <div className="loading">
            <div className="loading__wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/1999/xlink" style={{
                    margin: "auto",
                    background: "transparent",
                    display: "block"
                }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                    <circle cx="50" cy="50" r="30" stroke="rgba(33, 117, 155, 0.1)" strokeWidth="10" fill="none"></circle>
                    <circle cx="50" cy="50" r="30" stroke="#21759b" strokeWidth="8" strokeLinecap="round" fill="none">
                        <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="2.4390243902439024s" values="0 50 50;180 50 50;720 50 50" keyTimes="0;0.5;1"></animateTransform>
                        <animate attributeName="stroke-dasharray" repeatCount="indefinite" dur="2.4390243902439024s" values="18.84955592153876 169.64600329384882;94.2477796076938 94.24777960769377;18.84955592153876 169.64600329384882" keyTimes="0;0.5;1"></animate>
                    </circle>
                </svg>
            </div>
        </div>
    );
};

export default Loading;