import React, { useEffect, useState, useRef } from 'react';
import '../assets/style/Postpage.css';
import { useParams } from 'react-router-dom';

const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // const userId = localStorage.getItem("userId");
  const { userId } = useParams(); // URL의 userId 가져오기
  // 게시물 형식 정의
  const defaultPost = {
    userId: userId,
    boardNum: "", // 게시물 번호
    replyCount: "", // 댓글 수
    likeCount: "", // 좋아요 수
    imageUrl: "", // 이미지 URL
  };

  // 페이지가 변경되면 게시물 가져오기
  useEffect(() => {
    if (hasMore) {
      fetchPosts();
    }
  }, [page, hasMore]); // 페이지 변경 시 fetchPosts 호출

  // 게시물 목록 가져오기
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/board/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          page: page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result); // 서버 응답 객체 전체를 출력

      // 응답 객체에서 data 속성을 사용하여 배열을 처리
      if (Array.isArray(result.data)) {
        // 데이터를 받아오고, 6개 이하일 경우 더 이상 로딩하지 않도록 설정
        if (result.data.length < 3) {
          setHasMore(false); // 6개 이하일 경우 더 이상 페이지를 증가시키지 않음
        }

        setPosts((prevPosts) => [...prevPosts, ...result.data]);
      } else {
        console.error('Returned data is not an array');
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleRemovePost = async (boardNum, userId) => {
    const isConfirmed = window.confirm('정말로 게시글을 삭제하시겠습니까?');
  
    if (isConfirmed) {
      try {
        if (!userId) {
          throw new Error('User ID is missing.');
        }
  
        // 로딩 상태 추가 (예: 삭제 버튼을 비활성화하거나 로딩 표시)
        const response = await fetch(`/api/board/posts/${userId}/${boardNum}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error('게시글 삭제 실패');
        }
  
        // 삭제된 게시글을 UI에서 제거
        setPosts(prevPosts => prevPosts.filter(post => post.boardNum !== boardNum));
  
        alert('게시글이 삭제되었습니다.');
  
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
        alert('게시글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };


  // 무한 스크롤 옵저버 설정
  const lastPostRef = (node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1); // 다음 페이지로 이동
        }
      },
      { threshold: 1.0 }
    );

    if (node) observer.current.observe(node);
  };

  return (
    <div className="posts-page">
      <h2>게시물</h2>
      <ul>
        {posts.map((post, index) => (
          <li key={post.boardNum} ref={index === posts.length - 1 ? lastPostRef : null}>
            <img src={`http://localhost:8080/api/file/thumbnail/${post.imageUrl}`} alt={`게시물 ${post.boardNum}`} />
            <p hidden>게시물 번호: {post.boardNum}</p>
            <div className="postNum">
              <div className="postLike">
                <img src={require('../assets/images/whitelike.png')} alt="좋아요 아이콘" />
                <p>{post.likeCount}</p>
              </div>
              <div className="postReply">
                <img src={require('../assets/images/whitereply.png')} alt="댓글 아이콘" />
                <p>{post.replyCount}</p>
              </div>
              <div className="postDelete">
                <button onClick={() => handleRemovePost(post.boardNum, userId)} className="remove-button">
                  <img src={require('../assets/images/whitedelete.png')} alt="삭제 아이콘" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostsPage;