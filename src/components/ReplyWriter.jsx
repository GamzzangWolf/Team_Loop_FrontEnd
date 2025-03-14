import React, { useState} from 'react';
import '../assets/style/reply.css'
import { useNavigate } from 'react-router-dom';
import useCreateNotification from '../hooks/useCreateNotification';

const ReplyWriter = ({ boardNum, onCommentAdd, boardUserId}) => {
    
    // console.log("onCommentAdd 전달 받음:", onCommentAdd); // 확인
    const [replyContents, setReplyContents] = useState(""); // 입력된 댓글 내용 관리
    const { isLoading, success, createNotification } = useCreateNotification();
    const userId = localStorage.getItem("userId");

    const requestData = {
        userId: userId, // 사용자 ID
        replyContents : "",
        boardNum : ""
    };

    const postReply = (boardNum, replyContents, setReplyContents, onCommentAdd) => {
        const requestDataWithBoardNum = {
            ...requestData,
            boardNum,
            replyContents,
        };

        console.log("보내는 데이터:", requestDataWithBoardNum); // 보내기 전 데이터 확인
        console.log("보드 아이디 " + boardUserId)
        fetch('/api/reply/write', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestDataWithBoardNum),
        })
            .then((response) => {
                console.log("HTTP 응답 상태:", response.status); // 상태 코드 확인
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("서버에서 받은 응답:", data); // 서버 응답 확인
                createNotification(3,boardUserId)
                alert("댓글 등록 완료");
                setReplyContents("");
                
                if (onCommentAdd) {
                    console.log("onCommentAdd 호출 전 전달 데이터:", data[0]); // 전달 데이터 확인
                    onCommentAdd(data[0]);
                }
            })
            .catch((error) => {
                console.error("댓글 작성 오류:", error);
            });
    };
    return (
        <>
            <div className='replyArea'>
                <div className='replyInputArea'>
                    <input type="text" className="" placeholder="댓글 달기..." value={replyContents} onChange={(e) => setReplyContents(e.target.value)} />
                </div>
                <button className='replyPostButton'onClick={() => postReply(boardNum, replyContents ,setReplyContents, onCommentAdd)}>게시</button>
            </div>
        </>
    );
};

export default ReplyWriter;