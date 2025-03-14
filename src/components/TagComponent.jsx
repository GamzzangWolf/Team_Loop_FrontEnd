import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/style/TagComponent.css'


const TagComponent = () => {
    const [searchInput, setSearchInput] = useState('');  // 검색 입력 값
    const [data, setData] = useState([]);  // 검색 결과
    const [error, setError] = useState(null);  // 오류 메시지
    const [mainPage, setMainPage] = useState(1);
  
    const userId = localStorage.getItem("userId");

    const navigate = useNavigate(); // useNavigate로 navigate 함수 초기화

    // 사용자 검색 입력값이 바뀔 때마다 상태 업데이트
    const handleInputChange = (event) => {
        setSearchInput(event.target.value);  // 입력값을 상태에 저장
    };
    

    // 검색 버튼 클릭 시 호출될 함수
    const handleSearch = () => {
        if (searchInput.trim() === '') {
            alert('검색어를 입력해주세요.');  // 입력값이 비어있다면 경고
            return;
        }

        fetchSearchResults(searchInput);  // 검색 결과 요청
    };

    // Enter 키 입력 시 호출되는 함수
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();  // Enter 키가 눌리면 handleSearch 호출
        }
    };

    // 검색 결과를 API로부터 요청하는 함수
    const fetchSearchResults = (query) => {
        axios.post('/api/tag/searchTag', { userInput: query })
            .then((response) => {
                setData(response.data);  // 응답 받은 데이터를 상태에 저장
            })
            .catch((error) => {
                console.error("데이터 요청 에러:", error);
                setError("데이터를 불러오는 데 실패했습니다.");  // 오류 처리
            });
    };

    // 검색한 태그의 이벤트를 처리하는 함수
    const handleTagClick = (tag) => {
        console.log('클릭된 태그:', tag);
        navigate('/MainTest', { state: { tagData: tag } });
    };

    return (
        <>
            <div className='tagSerchBar'>
                <input 
                    type="search" 
                    value={searchInput} 
                    onChange={handleInputChange} 
                    onKeyDown={handleKeyDown}
                    placeholder="#TAG SEARCH" 
                />
                <button type="button" onClick={handleSearch}>
                    <img src={require('../assets/images/검색.png')} alt="검색" />
                </button>
            </div>
            
            <hr />

            <div>
                {/* 검색 결과 출력 */}
                {error && <div>{error}</div>}  {/* 에러 메시지 출력 */}
                {data.length === 0 && !error && <div>검색된 태그가 없습니다.</div>}  {/* 결과가 없을 때 표시 */}

                {/* 데이터가 있을 경우 */}
                {data.length > 0 && !error && (
                    <ul>
                        {data.map((item, index) => {
                            // tagInfo가 JSON 문자열일 경우 이를 파싱하여 객체로 변환
                            const tag = JSON.parse(item.tagInfo);
                            return (
                                <div className='tagSearchResult'>
                                    <li key={index}>
                                        <div onClick={()=> handleTagClick(tag)}  style={{ cursor: 'pointer' }}>
                                            <strong>{tag.tag}</strong> - {tag.normalizedTag}
                                            <hr />
                                        </div>
                                     </li>
                                </div>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}

export default TagComponent;