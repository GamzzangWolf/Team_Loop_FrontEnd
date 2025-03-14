import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from "@react-oauth/google";  // GoogleOAuthProvider 임포트
import LoginPage from './pages/LoginPage';
import Main from './pages/Main';
import Maintest from './pages/Maintest';
import BlockUser from './pages/BlockUser';
import ProfileModify from './pages/ProfileModify';
import Profile from './pages/Profile';
import FindID from './pages/FindID';
import ChatPage from './pages/ChatPage';
import WebSocketProvider from './components/WebSocketContext';
import PostDetail from './components/PostDetail';
import LoginCallback from './pages/LoginCallback';

function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage/>}></Route>
          <Route path="/Maintest" element={<Maintest/>} /> 
          <Route path="/Main" element={<Main/>} />
          <Route path="/Chat/:userId" element={<ChatPage/>}></Route>
          <Route path="/BlockUser" element={<BlockUser />} />
          <Route path="/ProfileModify" element={<ProfileModify/>}/>
          <Route path="/Profile/:userId" element={<Profile />} />
          <Route path="/FindID" element={<FindID/>}/>
          <Route path="/postDetail/:boardNum" element={<PostDetail/>} />
          <Route path='/callback' element={<LoginCallback/>}/>
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;