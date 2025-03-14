import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import '../assets/style/PostDetail.css';
import Loading from '../layout/Loading';
import ReplyWriter from './ReplyWriter';
import Buttons from '../layout/Buttons';

Modal.setAppElement('#root');

const PostDetail = ({ isOpen, onClose, boardnum, onCommentAdd }) => {
    const [postData, setPostData] = useState(null); // 게시글 데이터 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [comments, setComments] = useState([]); // 댓글 데이터 상태
    const [editCommentId, setEditCommentId] = useState(null); // 수정할 댓글 ID
    const [editCommentText, setEditCommentText] = useState(''); // 수정 중인 댓글 텍스트
    const [editBoardNum, setEditBoardNum] = useState(null);
    const [page, setPage] = useState(1); // 페이지 상태
    const [hasMoreComments, setHasMoreComments] = useState(true); // 더 불러올 댓글이 있는지 여부
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // 현재 이미지 인덱스
    const [likeCheck, setLikeCheck] = useState({ likeCheck: false });

    const addNewComment = (comment) => {
        setComments((prevComments) => [comment, ...prevComments]); // 새 댓글을 맨 앞에 추가
        onCommentAdd(comment);
    };


    const userId = localStorage.getItem("userId");
    const userProfile = localStorage.getItem("profile");

    // 게시글 상세 데이터 가져오기
    useEffect(() => {
        if (isOpen) {
            const fetchPostDetail = async () => {
                try {
                    const response = await fetch(`/api/board/postDetail/${boardnum}`);
                    const data = await response.json(); // 응답을 JSON으로 변환
                    setPostData(data);
                    setLoading(false);
                } catch (error) {
                    console.error("게시글 상세 정보를 불러오는 중 오류가 발생했습니다:", error);
                    setLoading(false);
                }
            };
            fetchPostDetail();
        }
        fetchComments();
        setPage(2);
    }, [boardnum, isOpen]);

    // 댓글 데이터 가져오기
    const fetchComments = async (isNewPage = false) => {
        try {
            // likeCheck를 JSON 문자열로 변환 및 URL 인코딩
            const encodedLikeCheck = encodeURIComponent(JSON.stringify(likeCheck));
            // 쿼리 파라미터를 URL에 직접 포함시켜 fetch로 요청
            const response = await fetch(`/api/reply/boardReplyWithProfile?boardNum=${boardnum}&page=${page}&userId=${userId}&likeCheck=${encodedLikeCheck}`);
            // 응답을 JSON 형태로 파싱
            const data = await response.json();
            console.log("data", data);

            // 댓글 목록과 프로필 이미지 URL을 상태에 저장
            setComments(prevComments => isNewPage ? [...prevComments, ...data.replies] : data.replies);

            // 댓글이 10개 미만이면 더 불러올 댓글이 없다고 판단
            setHasMoreComments(data.replies.length === 10);
        } catch (error) {
            console.error("댓글 데이터를 가져오는 중 오류가 발생했습니다:", error);
        }
    };

    // 이미지 좌우 이동
    const handlePreviousImage = () => {
        if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
    };

    const handleNextImage = () => {
        if (currentImageIndex < postData.boardImg.length - 1) setCurrentImageIndex(currentImageIndex + 1);
    };

    // 댓글 삭제
    const handleDeleteComment = async (replyNum) => {
        try {
            const requestData = { userId, replyNum };

            const response = await fetch('/api/reply/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json', // JSON 형식으로 전달
                },
                body: JSON.stringify(requestData), // 요청 본문에 replyNum 포함
            });

            if (response.ok) {
                setComments(comments.filter(comment => comment.replyNum !== replyNum)); // 댓글 삭제 후 화면 갱신
            } else {
                const errorResponse = await response.text();
                console.error('댓글 삭제 실패:', errorResponse);
            }
        } catch (error) {
            console.error('댓글 삭제 중 오류가 발생했습니다:', error);
        }
    };



    // 댓글 수정 모드 진입
    const handleEditComment = (comment) => {
        setEditCommentId(comment.replyNum);
        setEditCommentText(comment.replyContents);
        setEditBoardNum(comment.boardNum);

    };

    const handleUpdateComment = async () => {
        try {
            const response = await fetch('/api/reply/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    replyNum: editCommentId,
                    replyContents: editCommentText,
                    userId: localStorage.getItem("userId"), // 유저 ID 포함
                    // boardNum을 보내지 않음
                }),
            });

            if (response.ok) {
                const updatedComment = await response.json();
                // updatedComment.profile = userProfile;  // 여기서 프로필 데이터 추가
                setComments(comments.map(comment =>
                    comment.replyNum === updatedComment[0].replyNum ? updatedComment[0] : comment
                ));
                setEditCommentId(null); // 수정 모드 종료
                setEditCommentText(''); // 수정 내용 초기화
            } else {
                const errorResponse = await response.text();
                console.error("댓글 수정 실패:", errorResponse);
            }
        } catch (error) {
            console.error("댓글 수정 중 오류가 발생했습니다:", error);
        }
    };

    const clickLike = async (userId, replyNum, isLiked) => {
        const likeCheck = isLiked === 1 ? 0 : 1; // 기존 값 반전 (1 -> 0, 0 -> 1)

        const likedataToSend = {
            userId: userId,
            replyNum: replyNum,
            likeCheck: likeCheck,
        };

        try {
            // 서버에 좋아요 상태를 변경하는 요청
            const response = await axios.post('/api/reply/likeToggle', likedataToSend, {
                headers: {
                    'Content-Type': 'application/json',  // JSON 형식으로 전송
                },
            });

            console.log('서버 응답:', response.data);

            // 댓글 목록에서 해당 댓글의 isLiked 값을 업데이트하여 상태 반영
            setComments((prevComments) =>
                prevComments.map((comment) =>
                    comment.replyNum === replyNum
                        ? { ...comment, isLiked: likeCheck }  // isLiked 값 반영
                        : comment
                )
            );
        } catch (error) {
            console.error('에러 발생:', error);
            // 에러 처리 로직 추가
        }
    };

    // 더 불러오기 버튼 클릭 시
    const handleLoadMore = () => {
        setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchComments(nextPage, true); // 업데이트된 page를 전달
            return nextPage;
        });
    };
    const formatTimeDifference = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time; // 밀리초 단위의 차이
    
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
    
        if (seconds < 60) {
            return `${seconds}초 전`;
        } else if (minutes < 60) {
            return `${minutes}분 전`;
        } else if (hours < 24) {
            return `${hours}시간 전`;
        } else if (days < 7) {
            return `${days}일 전`;
        } else {
            // 7일 이상은 날짜 표시
            return time.toLocaleDateString(); // ex) 'YYYY-MM-DD' 포맷
        }
    };

    if (!postData) return null; // 데이터가 없을 경우 null 반환

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="modal-content"
            overlayClassName="modal-overlay"
            closeTimeoutMS={300}
        >
            <button className="modal-close-button" onClick={onClose}>
                &times;
            </button>
            <div className='PostDetailForm'>
                <div className="PostDetailContainer">
                    <div className='DetailImage'>
                        <button
                            onClick={handlePreviousImage}
                            disabled={currentImageIndex === 0}
                            className="nav-button prev-button"
                        ></button>
                        <img
                            src={`${`http://localhost:8080/api/file/thumbnail/${postData.boardImg[currentImageIndex]}`}`}
                            alt={`게시글 이미지 ${currentImageIndex + 1}`}
                        />
                        <button
                            onClick={handleNextImage}
                            disabled={currentImageIndex === postData.boardImg.length - 1}
                            className="nav-button next-button"
                        ></button>
                    </div>

                    <div className='DetailInfo'>
                        <div className='detailWithReply'>
                            <div className='TopUserInfo'>
                                <div className='ProfilePic'>
                                    <img src={`http://localhost:8080/api/file/thumbnail/${postData.writer.profile}`} alt="프로필 이미지" className="ProfileImage" />
                                </div>
                                <span className="username">{postData.writer.userId}</span>
                            </div>
                            <div className='detailLine'></div>
                            <div className="ContentArea">
                                <div className='PostContent'>
                                    <div className='PostUser'>
                                        <div className='PostProfilePic'>
                                            <img src={`http://localhost:8080/api/file/thumbnail/${postData.writer.profile}`} alt="프로필 이미지" />
                                        </div>
                                        <span className="post-username">{postData.writer.userId}</span>
                                        <p> # {postData.board.boardLocation}</p>
                                    </div>
                                    <p>{postData.board.boardContents}</p>
                                </div>

                                {/* <hr /> */}
                            </div>
                            {/* 댓글 */}
                            <div className='comments'>
                                {comments.map((comment, index) => (
                                    <div className='comment' key={index}>
                                        <div className='commentHeader'>
                                            <div className='commentProfilePic'>
                                                <img
                                                    src={`http://localhost:8080/api/file/thumbnail/${comment.profile}`}
                                                    alt="댓글 프로필"
                                                    className="commentProfileImage"
                                                />
                                            </div>
                                            <span className="commentUsername">{comment.userId}</span>
                                            {comment.userId === postData.writer.userId && (
                                                <>
                                                    <button className='fixButton' onClick={() => handleEditComment(comment)}>수정</button>
                                                    <button className='delButton' onClick={() => handleDeleteComment(comment.replyNum)}>삭제</button>
                                                </>
                                            )}
                                        </div>
                                        {editCommentId === comment.replyNum ? (
                                            <div className="editComment">
                                                <input
                                                    type="text"
                                                    value={editCommentText}
                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                />
                                                <button className='compButton' onClick={handleUpdateComment}>완료</button>
                                                <button className='cancelButton' onClick={() => setEditCommentId(null)}>취소</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className='comment_cont'>
                                                    <div className='comment_cont2'>
                                                        <div className="commentText">{comment.replyContents}</div>
                                                        <div className="commentTime">{formatTimeDifference(comment.replyTime)}</div>
                                                    </div>
                                                    <button
                                                        className="commentLike" onClick={() => clickLike(userId, comment.replyNum, comment.isLiked)}
                                                    ><img
                                                            src={require(`../assets/images/${comment.isLiked === 1 ? "좋아요_컬러.png" : "알림.png"}`)} alt="좋아요" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                ))}
                            </div>
                            {hasMoreComments && (
                                <button onClick={handleLoadMore} className="loadMoreButton">
                                    더 불러오기
                                </button>
                            )}
                            <div className='replyWriteArea'>
                                <div className="likeCountIcons">
                                    <Buttons boardNum={boardnum} loginUser={userId} />
                                </div>
                                <ReplyWriter boardNum={boardnum} onCommentAdd={addNewComment} />
                                {console.log("번호 확인", boardnum)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>    
        </Modal>
    );
};

export default PostDetail;