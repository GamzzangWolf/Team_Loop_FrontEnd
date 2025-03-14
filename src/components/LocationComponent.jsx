import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/style/LocationComponent.css'

const LocationComponent = () => {
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]); // 도시 데이터를 저장할 상태
    const [selectedProvince, setSelectedProvince] = useState(''); // 선택된 province
    const [selectedCity, setSelectedCity] = useState(''); // 선택된 city

    const navigate = useNavigate(); 
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        // axios를 사용해 provinces 데이터를 처음에 가져옵니다.
        fetch('/api/local/province', {
            method: 'GET', // GET 요청임을 명시
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // 응답 데이터를 JSON으로 파싱
            })
            .then((data) => {
                setProvinces(data); // 데이터를 상태에 저장
            })
            .catch((error) => {
                console.error('There was an error fetching the provinces:', error); // 에러 처리
            });
    }, []);

    const handleProvinceChange = (event) => {
        const province = event.target.value;
        setSelectedProvince(province); // 선택된 province 업데이트

        if (province) {
            // province가 선택되었을 때, 해당 province에 대한 도시 데이터를 가져옵니다.
            fetch('/api/local/getCity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // 요청 데이터 형식을 JSON으로 지정
                },
                body: JSON.stringify({ province }), // 요청 데이터를 JSON 문자열로 변환
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json(); // 응답 데이터를 JSON으로 파싱
                })
                .then((data) => {
                    setCities(data); // 도시 데이터를 상태에 저장
                })
                .catch((error) => {
                    console.error('There was an error fetching the cities:', error); // 에러 처리
                });
        } else {
            setCities([]); // province 선택이 해제되면 도시 데이터 초기화
        }
    };

    const handleCityClick = (city) => {
        setSelectedCity(city); // 선택된 city 업데이트
        // console.log(`Selected Province: ${selectedProvince}, Selected City: ${city}`);
        navigate('/MainTest', { state: { locationData: (selectedProvince + " "+ city) } });
    };

    return (
        <div className='locationComP'>
            <h1>Provinces</h1>
            <select onChange={handleProvinceChange} value={selectedProvince}>
                <option value="">Select a province</option>
                {provinces.map((province, index) => (
                    <option key={index} value={province}>
                        {province}
                    </option>
                ))}
            </select>

            {selectedProvince && (
                <div>
                    <h2>Cities in {selectedProvince}</h2>
                    <ul>
                        {cities.length > 0 ? (
                            cities.map((city, index) => (
                                <li key={index}
                                onClick={() => handleCityClick(city)}
                                >{city}</li>
                            ))
                        ) : (
                            <p>No cities available.</p>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LocationComponent;