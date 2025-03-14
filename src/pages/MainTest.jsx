import React, { useEffect, useState, useRef ,useCallback, useContext} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/style/Main.css'
import Sub1 from '../components/Sub1';
import Sub2 from '../components/Sub2';
import Leftbar from '../layout/Leftbar';
import { Link } from 'react-router-dom';
import PostDetail from '../components/PostDetail';
import Buttons from '../layout/Buttons';
import ReplyWriter from '../components/ReplyWriter';
import { WebSocketContext } from '../components/WebSocketContext';

const Main = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostDetailOpen, setIsPostDetailOpen] = useState(false); // 모달 열기/닫기 상태
    const [isReplyVisible, setIsReplyVisible] = useState({}); // 댓글 입력창 상화 관리
    const searchInputRef = useRef(null); // ref 추가
    const [searchTerm, setSearchTerm] = useState('');
    const currentboardId = useRef(null);
    const coordinatesMapRef = useRef({});
    const [selectedComponent, setSelectedComponent] = useState("Sub1");

    const location = useLocation();  // location 객체를 사용
    const navigate = useNavigate();
    const [imageIndexes, setImageIndexes] = useState({}); // 각 게시물의 현재 이미지 인덱스를 관리하는 상태
    const [showMapBox, setShowMapBox] = useState({}); // 각 게시물만큼 mapBox 표시 여부 관리

    const [mainPage, setMainPage] = useState(1); // 현재 페이지 번호
    const [mainHasMore, setMainHasMore] = useState(true); // 더 가져올 데이터 여부
    const mainObserverRef = useRef(null); // IntersectionObserver용 ref
    const { stompClient } = useContext(WebSocketContext);
    const userId = localStorage.getItem("userId");
    const [searchKeywords, setSearchKeywords] = useState('');

    const [isSearching, setIsSearching] = useState(false);

    const [searchTrigger, setSearchTrigger] = useState(0); // 강제 트리거 상태


    const [searchTag, setSearchTag] = useState('');  // searchTag 상태를 설정
    const [locationData, setLocationData] = useState('')
    // location에서 searchTag를 가져와서 설정
    useEffect(() => {
        // 상태 초기화
        setError(null);
        setSelectedPost(null);
        setIsPostDetailOpen(false);
        setIsReplyVisible({});
        setSearchTerm('');
        setMainHasMore(true);
        setImageIndexes({});
        setShowMapBox({});
        setSearchTag('');
        setLocationData('');
        setIsSearching(false);

        if (location.state) {
            // location.state 값에 따라 데이터를 가져오는 로직 추가
            if (location.state.tagData) {
                setSearchTag(location.state.tagData.tag);
                searchInputRef.current.value = ""; // 입력 필드 값 초기화
                setIsSearching(false);
                // console.log(searchTag);
                setSearchTerm("");
            } else if (location.state.locationData) {
                setLocationData(location.state.locationData);
                searchInputRef.current.value = ""; // 입력 필드 값 초기화
                setIsSearching(false);
                setSearchTerm("");
                // console.log(locationData);
            }
        }
    }, [location]); // location 의존성 추가
    

    useEffect(() => {
        if (!data) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const imgBox = entry.target; // 관찰 대상인 imgBox
                        const boardId = imgBox.dataset.boardid; // 데이터 속성에서 boardId 가져오기

                        if (currentboardId.current !== boardId) {
                            currentboardId.current = boardId; // 현재 게시글 ID 갱신
                            const mapBox = imgBox.querySelector(".mapBox");
                            let isMapBoxVisible = false;
    
                            if (mapBox) {
                                // mapBox의 display 상태 확인
                                isMapBoxVisible = mapBox.style.display === "block";
                                console.log(
                                    `게시글 ${boardId}의 mapBox 상태: ${
                                        isMapBoxVisible ? "보이는 상태" : "숨겨진 상태"
                                    }`
                                );
                            } else {
                                console.warn(`게시글 ${boardId}의 mapBox를 찾을 수 없습니다.`);
                            }
        
                            if (isMapBoxVisible) {
                                setSelectedComponent("Sub2");
                            } else {
                                setSelectedComponent("Sub1");
                            }
                        }
    
                        // 좌표 설정
                        const coords = coordinatesMapRef.current[boardId];
                        if (coords) {
                            setSelectedCoordinates(coords);
                            currentboardId.current = boardId;
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.8,
            }
        );
        // imgBox를 관찰 대상으로 설정
        Object.values(mapContainerRef.current)
            .filter((mapContainer) => mapContainer) // null 값 걸러내기
            .forEach((mapContainer) => {
                const imgBox = mapContainer.closest(".imgBox");
                if (imgBox) {
                    observer.observe(imgBox);
                }
            });
    }, [data]);
    

    const onClickSearch = async () => {  
        const inputValue = searchInputRef.current.value;

        // 동일한 검색어일 경우에도 실행
        if (searchTerm === inputValue) {
            setSearchTrigger((prev) => prev + 1); // 강제 트리거 업데이트
        } else {
            setSearchTerm(inputValue); // 검색어 변경
        }

        setIsSearching(true);
        setMainPage(1); // 첫 페이지로 초기화
        setMainHasMore(true); // 더 가져올 데이터가 있다고 설정
        setData([]); // 기존 데이터 초기화
        setLocationData("");
        setSearchTag("");
    };


    const searchPosts = async (currentPage) => {
        try {
            console.log(searchTerm);
            const requestData = {
                query: searchTerm || "",
                userId: userId,
                page: currentPage, // 검색은 항상 첫 페이지부터 시작
            };
            console.log("requestData", requestData);
    
            // `fetch`를 사용해 POST 요청 보내기
            const response = await fetch('/api/board/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // JSON 데이터 전송
                },
                body: JSON.stringify(requestData), // 요청 데이터를 JSON 문자열로 변환
            });
    
            // 응답 데이터 처리
            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status}`); // HTTP 오류 처리
            }
    
            const fetchedData = await response.json(); // JSON 데이터 파싱
    
            if (fetchedData.data) {
                // UserLogedIn 데이터는 첫 페이지에만 추가
                const posts = fetchedData.data;
                console.log(posts);
                console.log(data);
                setData((prevData) => [...prevData, ...posts]);
    
                // 데이터가 더 이상 없을 경우 hasMore를 false로 설정
                setMainHasMore(posts.length > 0);
            }
        } catch (err) {
            console.error('데이터 요청 에러:', err); // 에러 로그 출력
            setError('데이터를 불러오는 데 실패했습니다.'); // 사용자에게 오류 알림
        }
    };


    // searchTag와 locationData가 변경될 때만만 데이터를 다시 가져오도록 설정
    useEffect(() => {
        if (searchTag || locationData) {
            window.scrollTo(0,0);
            searchInputRef.current.value = ""; // 입력 필드 값 초기화
            setData([]);  // 기존 데이터를 초기화
            setIsSearching(false);
            setMainPage(1);  // 페이지 번호 초기화
            fetchPosts(1);
        }else if(searchTerm || searchTrigger){
            searchInputRef.current.value = ""; // 입력 필드 값 초기화
            window.scrollTo(0,0);
            setData([]);
            setMainPage(1);
            searchPosts(mainPage);
        }
    }, [searchTag, locationData, searchTerm, searchTrigger]); // searchTag나 locationData나 searchTerm 변경될 때만만 실행


    const fetchPosts = async (currentPage) => {
        if(isSearching) return;
        try {
            const requestData = {
                userId: userId, // 사용자 ID
                tagName: searchTag || "", // 테스트용 태그 이름
                boardContents: '', // 테스트용 공지문 내용
                boardLocation: locationData || "", // 테스트용 공지문 위치
                page: currentPage, // 페이지 번호
            };
            console.log("requestData", requestData);
    
            // `fetch`를 사용해 POST 요청 보내기
            const response = await fetch('/api/board/main', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // JSON 데이터 전송
                },
                body: JSON.stringify(requestData), // 요청 데이터를 JSON 문자열로 변환
            });
    
            // 응답 데이터 처리
            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status}`); // HTTP 오류 처리
            }
    
            const fetchedData = await response.json(); // JSON 데이터 파싱
    
            if (fetchedData.data) {
                // UserLogedIn 데이터는 첫 페이지에만 추가
                const posts = fetchedData.data;
                setData((prevData) => [...prevData, ...posts]);
    
                // 데이터가 더 이상 없을 경우 hasMore를 false로 설정
                setMainHasMore(posts.length > 0);
            }
        } catch (err) {
            console.error('데이터 요청 에러:', err); // 에러 로그 출력
            setError('데이터를 불러오는 데 실패했습니다.'); // 사용자에게 오류 알림
        }
    };

    useEffect(() => {
        if (stompClient && stompClient.connected) {
            const subscription = stompClient.subscribe(
                `/topic/ranking`,
                (message) => {
                    const keywords = JSON.parse(message.body);
                    // console.log(keywords);
                    setSearchKeywords(keywords);
                }
            );
            return () => {
                subscription.unsubscribe(); // 컴포넌트가 사라질 때 구독 해제
            };
        }
    }, [stompClient, userId]);



    // 카카오맵 관련 상태 및 참조
    const [selectedCoordinates, setSelectedCoordinates] = useState(null); // Sub2로 전달할 좌표
    const mapContainerRef = useRef({});

    // 카카오맵 스크립트 로드
    const loadKakaoMapScript = () => {
        return new Promise((resolve, reject) => {
            const scriptId = "kakao-map-script";
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                if (window.kakao && window.kakao.maps) {
                    resolve();
                } else {
                    existingScript.onload = () => {
                        window.kakao.maps.load(resolve);
                    };
                }
                return;

            }
    
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=da4051ab00ad7d68993bd687c2d129f2&autoload=false&libraries=services";
            script.async = true;
    
            script.onload = () => {
                window.kakao.maps.load(resolve);
            };
    
            script.onerror = reject;
    
            document.head.appendChild(script);
        });
    };
    
    useEffect(() => {
        loadKakaoMapScript()
            .then(() => {
                console.log("Kakao 맵 로드 완료");
                // 여기서 Kakao Maps 초기화 함수 호출
            })
            .catch((error) => {
                console.error("Kakao 맵 스크립트 로드 실패:", error);
            });
    }, []);

    
    // 지도 생성 함수
    const showMap = (boardId, address, isFirstPost = true) => {
        if (!window.kakao || !window.kakao.maps || !address) return;

        const container = mapContainerRef.current[boardId];
        if (!container) {
            console.error(`Map container for boardId ${boardId} not found.`);
            return;
        }
        console.log(1);
        const geocoder = new window.kakao.maps.services.Geocoder();
        console.log(2);
        // 주소 검색 후 좌표로 변환
        console.log(address);
        geocoder.addressSearch(address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const coords = {
                    x: result[0].x,
                    y: result[0].y,
                };
                console.log(3);
                const options = {
                    center: new window.kakao.maps.LatLng(coords.y, coords.x),
                    level: 3, // 줌 레벨
                    mapTypeControl: false,
                    zoomControl: false,
                };
                console.log(4);
                const map = new window.kakao.maps.Map(container, options);

                // 마커 추가
                new window.kakao.maps.Marker({
                    map,
                    position: new window.kakao.maps.LatLng(coords.y, coords.x),
                });
                coordinatesMapRef.current[boardId] = coords;
                console.log(selectedComponent);
                if(selectedComponent=="Sub1"){
                    setSelectedComponent("Sub2");
                }

                setSelectedCoordinates(coords); // 좌표를 Sub2로 전달
    
                // 첫 번째 공지문일 경우 중심 좌표 설정
                
            } else {
                console.error("주소 검색 실패:", address);
            }
        });
    };

    useEffect(() => {
        if(isSearching == false){
            if(mainPage === 1){
                // fetchPosts(mainPage);  // 페이지가 변경되었을 때 데이터 로드
                if(!(searchTag || locationData)){
                    fetchPosts(mainPage);  // 페이지가 변경되었을 때 데이터 로드
                }
            }else{
                fetchPosts(mainPage);  // 페이지가 변경되었을 때 데이터 로드
            }
        }
        else{
            if(mainPage === 1){
                if(!(searchTerm)){
                    console.log("검색결과로 조회 실행되지 않음")
                    searchPosts(mainPage);
                }
            }else{
                console.log("검색 결과로 조회 실행됨")
                searchPosts(mainPage);
            }
           
        }
    }, [mainPage, isSearching]);

    // 상태 초기화
    useEffect(() => {
        setData([]);
        setError(null);
        setSelectedPost(null);
        setIsPostDetailOpen(false);
        setIsReplyVisible({});
        setSearchTerm('');
        setSearchTag('');
        setLocationData('');
        setMainPage(1); 
        setMainHasMore(true); 
        setImageIndexes({});
        setShowMapBox({});
    }, []); 

    const lastPostRef = useCallback((node) => {
        if (mainObserverRef.current) mainObserverRef.current.disconnect();

        mainObserverRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && mainHasMore) {
                setMainPage((prevPage) => prevPage + 1); // 다음 페이지 요청
            }
        });

        if (node) mainObserverRef.current.observe(node);
    }, [mainHasMore]);

    const handleOpenPostDetail = (post) => {
        // console.log("post 확인", post)
        setSelectedPost(post); // 선택한 공지문을 상태에 저장
        setIsPostDetailOpen(true);
    };

    const handleClosePostDetail = () => {
        setSelectedPost(null); // 모달 닫을 때 공지문을 초기화
    }

    const handlePictureButton = (boardId, direction, boardImgLength, boardLocation) => {
        setImageIndexes((prev) => {
            const currentIndex = prev[boardId] || 0; // 현재 인덱스
            let newIndex = currentIndex;
    
            // 이동 처리
            if (direction === 'prev') {
                if (showMapBox[boardId]) {
                    // mapBox가 표시될 때는 뒤로 가기 시 마지막 이미지로 이동
                    newIndex = boardImgLength - 1;
                    setShowMapBox((prevMap) => ({ ...prevMap, [boardId]: false })); // mapBox 숨기기
                } else {
                    // 첫 번째 이미지에서 prev 버튼을 누른 경우 마지막 이미지로 이동
                    if (currentIndex > 0) {
                        newIndex = currentIndex - 1;
                    } else {
                        // 첫 번째 이미지에서 prev 버튼을 누른 경우 마지막 이미지로 이동
                        newIndex = boardImgLength - 1;
                    }
                }
            } else if (direction === 'next') {
                if (currentIndex < boardImgLength - 1) {
                    newIndex = currentIndex + 1;
                    setShowMapBox((prevMap) => ({ ...prevMap, [boardId]: false })); 
                    setSelectedComponent("Sub1");
                } else {
                    // 마지막 이미지에 도달하면 mapBox 표시
                    newIndex = currentIndex;
                    setShowMapBox((prevMap) => ({ ...prevMap, [boardId]: true }));
                    console.log("showMap호출")
                    showMap(boardId, boardLocation, false);
                    setSelectedComponent("Sub2");
                }
            }  
            return { ...prev, [boardId]: newIndex };
        });
    };


    const handleReplyWriter = (boardNum) => {
        setIsReplyVisible((prev) => ({
            ...prev,
            [boardNum]: !prev[boardNum] // 해당 boardNum의 상태만 반전
        }));
    };

    const handleGoToProfilePage = (writerUserId) =>{
        navigate(`/Profile/${writerUserId}`);
    }

    const handleCommentAdd = (comment) => {
        const { boardNum } = comment; // 댓글 객체에서 boardNum 추출
        if (!boardNum) {
            console.error("boardNum이 undefined입니다.", comment);
            return;
        }

        // console.log("부모에서 받은 댓글:", comment); // 부모에서 받은 댓글 확인
    
        setData((prevData) => {
        
            // 데이터 순환하며 업데이트
            const updatedData = prevData.map((item) => {
                // `boardNum`이 일치하는 항목을 찾음
                if (item.board && item.board.boardNum === boardNum) {
                    return {
                        ...item, // 기존 데이터를 복사
                        replyCount: item.replyCount + 1, // `replyCount`를 1 증가
                    };
                }
                return item; // 일치하지 않으면 원래 데이터 유지
            });
        
            // 업데이트된 배열을 상태로 설정
            return updatedData;
        });
    };
    
    


    if (error) return <div>{error}</div>;
    if (!data) return <div>Loading...</div>;

    const renderPosts = (data) => {
        return data.map((item, index) => {
            const { replyCount, likeCount, writer, board, boardImg } = item;
            const currentImageIndex = imageIndexes[board.boardNum] || 0; // 현재 이미지 인덱스
            const isFirstImage = currentImageIndex === 0;
    
            return (
                <div className="post" key={board.boardNum} ref={index === data.length - 1 ? lastPostRef : null}>
                    <div className="profile">
                        <div className="profile_img" onClick={() =>handleGoToProfilePage(writer.userId)}>
                            <img src={`http://localhost:8080/api/file/thumbnail/${writer.profile}`} alt="test" />
                        </div>
                        <div className="profile_cont">
                            <div className="name">{writer.userId}</div>
                            <div className="location">{board.boardLocation}</div>
                        </div>
                    </div>
                    <div className="images">
                        <div className="picLRButton">
                            <div
                                className={`picLeft ${!showMapBox[board.boardNum] && isFirstImage ? 'arrowHide' : ''}`}
                                onClick={() => handlePictureButton(board.boardNum, 'prev', boardImg.length, board.boardLocation)}
                            ></div>
                            <div
                                className={`picRight ${showMapBox[board.boardNum] ? 'arrowHide' : ''}`}
                                onClick={() => handlePictureButton(board.boardNum, 'next', boardImg.length, board.boardLocation)}
                            ></div>
                        </div>
                        <div className="imgBox"  data-type="imgBox"
                        data-boardid={board.boardNum}>
                            {boardImg && boardImg.length > 0 && currentImageIndex < boardImg.length && !showMapBox[board.boardNum] && (
                                <img src={`http://localhost:8080/api/file/thumbnail/${boardImg[currentImageIndex]}`} alt="test" />
                            )}
                            <div
                                className="mapBox"
                                ref={(el) => (mapContainerRef.current[board.boardNum] = el)}
                                data-boardid={board.boardNum} data-setsub={boardImg && boardImg.length > 0 && currentImageIndex < boardImg.length && !showMapBox[board.boardNum]}
                                data-address={board.boardLocation}
                                style={{
                                    height: "470px",
                                    width: "470px",
                                    display: showMapBox[board.boardNum] ? "block" : "none", // 조건부로 보이기/숨기기
                                }}
                            />
                        </div>
                    </div>
                    <Buttons boardNum={board.boardNum} loginUser={userId} boardUserId={board.userId} />
                    <div className="cont">
                        <div>
                            <Link to={`/user/${writer.userId}`}>{writer.userId}</Link>
                        </div>
                        <div>{board.boardContents}</div>
                    </div>
                    <div className="replies">
                        <div>
                            <div onClick={() => handleOpenPostDetail(board.boardNum)}>댓글 {replyCount}개 보기</div>
                        </div>
                        <div>
                            <div className="replyButton" onClick={() => handleReplyWriter(board.boardNum)} >댓글 달기</div>
                            <div style={{ display: isReplyVisible[board.boardNum] ? 'block' : 'none' }}>
                                <ReplyWriter boardNum={board.boardNum} onCommentAdd={handleCommentAdd} boardUserId={board.userId}/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };
    


    return (
        <div>
            <Leftbar />
            <div className="con1">
                <div className="search">
                    <input
                        type="text"
                        className="search"
                        placeholder="검색어 입력"
                        ref={searchInputRef}  // ref로 참조
                    />
                    <button onClick={onClickSearch}>
                        <img src={require('../assets/images/검색.png')} alt="검색" />
                    </button>
                </div>
                {!data ? (
                    <>
                        <div>데이터가 없습니다.</div>
                    </>
                ) : (
                    <>
                        {/* {console.log("서치 텀", searchTerm ? true: false)} */}
                        {/* {console.log("isSerching?", isSearching)} */}
                        {/* {console.log("데이터",data)} */}
                        {data.length === 0 ? (<div>검색 결과가 없습니다.</div>) : (renderPosts(data))}
                    </>             
            )}
            </div>
            {
                selectedPost && (
                    <PostDetail
                        isOpen={isPostDetailOpen}
                        boardnum={selectedPost}
                        onClose={handleClosePostDetail}
                        onCommentAdd={handleCommentAdd}
                    />
                )
            }
            {selectedComponent === "Sub2" ? (
                <Sub2 selectedCoordinates={selectedCoordinates} />
            ) : selectedComponent === "Sub1" ? (
                <Sub1 searchKeywords={searchKeywords}/>
            ) : null}

        </div >
    );
};

export default Main;