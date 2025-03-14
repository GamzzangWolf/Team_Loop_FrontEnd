import React from 'react';
import '../assets/style/Loading.css';

const Loading=()=> {
    return (
        <div className="loading-container">
            <img src={require('../assets/images/Logo.png')} alt="로딩 중" className="loading-image" />
            <img src={require('../assets/images/LogoText.png')} alt="텍스트" className='text-image'/>
        </div>
    );
}

export default Loading;