import React from 'react';
import io from 'socket.io-client';

import UserJoinRoom from './components/UserJoinRoom';
import Conversation from './components/Conversation';
// import VideoChat from './components/VideoChat';

import { Card } from 'antd';
import { Layout } from 'antd';

import './App.css';

const { Header, Footer, Content } = Layout;

class App extends React.Component {

  constructor() {
    super();
    this.state = {
      pcConfig: {
        'iceServers': [
          {
            'url': 'stun:stun.l.google.com:19302'
          },
          {
            'url': 'turn:120.77.253.101:3478',
            'username': 'inter_user',
            'credential': 'power_turn'
          }
        ]
      },
      offerOptions: {
        offerToReceiveVideo: 1,
        offerToReceiveAudio: 1
      },
      biPeersList: [],
      peerList: Object.create(null),
      pc: null,
      localPc1: null,
      localPc2: null,
      pcMsgTo: {},
      remotePc: null,
      isStarted: false,
      isTeacher: true,
      isReady: false,
      sendingMsg: '',
      activeTab: 'chatTab',
      onlineClients: [],
      webrtc: null,
      socket: null,
      messages: [],
      localVideo: null,
      remoteVideo1: null,
      remoteVideo2: null,
      remoteVideo3: null,
      localStream: null,
      remoteStream: null,
      remoteStreamNum: 0,
      mediaStreamConstraints: {
        video: true,
        audio: true
      },
      form: {
        username: '',
        password: ''
      }
    }
    this.onJoinRoom = this.onJoinRoom.bind(this);
    this.onStartLocalStream = this.onStartLocalStream.bind(this);
  }
  // 更新消息信息
  updateChatMessage = (data) => {
    this.setState({
      messages: [...this.state.messages, data]
    })
  };

  onJoinRoom = (user) => {
    console.log('join room ' + user.username);
    const url = 'http://localhost:9000';
    this.socket = io.connect(url, {query: {username: user.username, room: 'hello'}});

    // 其他用户加入聊天室
    this.socket.on('join', (data) => {
      this.updateChatMessage({msg: data.username + '加入了聊天室', type: 'sys'})
    })
    // 自己加入成功
    this.socket.on('joined', () => {
      console.log('i joined th room')
    })
    this.socket.on('ready', () => {
      this.setState({
        isReady: true
      })
    })
    // 自己离开了
    this.socket.on('left', () => {
      this.socket.disconnect();
      this.setState({
        messages: [],
        onlineClients: []
      })
    })
    // 别人离开了
    this.socket.on('leave', data => {
      this.updateChatMessage({msg: data.username + '离开了聊天室', type: 'sys'})
      if (this.state.biPeersList[data.userId]) {
        this.state.biPeersList[data.userId].close();

        let perList = [...this.state.biPeersList];
        delete perList[data.userId];
        this.setState({
          biPeersList: perList
        })
      }
    })
    // 更新在线人数列表
    this.socket.on('clients', (data) => {
      console.log('clients', data);
      this.setState({
        onlineClients: data
      })
    })
    // this.socket.on('pc message', (data) => {
    //   console.log('客户端收到了pc的消息', data);
    //   this.signalingMessageCallback(data)
    // })
    // // 收到别人发的聊天信息
    // this.socket.on('message', data => {
    //   this.updateChatMessage(data)
    // })
    // // 收到别人的要求视频互动的私信
    // this.socket.on('interact', data => {
    //   this.$confirm(`${data.from.username}想和你视频互动，请接受`, '提示信息', {
    //     distinguishCancelAndClose: true,
    //     confirmButtonText: '接受',
    //     cancelButtonText: '拒绝'
    //   })
    //     .then(() => {
    //       // 同意和对方互动, 对方发起，自己接受
    //       this.socket.emit('agree interact', data)
    //       this.pcMsgTo = data.from
    //       this.createPeerConnection(false, data)
    //     })
    //     .catch(() => {
    //       // 拒绝和对方互动
    //       this.socket.emit('refuse interact', data)
    //     })
    // })
    // // 对方同意了了和你视频互动，自己发起，对方接受
    // this.socket.on('agree interact', data => {
    //   this.$message({type: 'success', message: `${data.to.username}接受了视频互动的请求`})
    //   this.pcMsgTo = data.to
    //   this.trace(`${data.to.username}接受了视频互动的请求`)
    //   this.createPeerConnection(true, data)
    // })
    // // 对方拒绝了和你视频互动
    // this.socket.on('refuse interact', data => {
    //   this.$message({type: 'warning', message: `${data.to.username}拒绝了视频互动的请求`})
    //   this.trace(`${data.to.username}拒绝了视频互动的请求`)
    // })
    // // 监听到对方结束互动
    // this.socket.on('stop interact', data => {
    //   let part = data.from
    //   this.$message({type: 'info', message: `${part.username}停止了和您互动，连接即将断开`, duration: 1500})
    //   console.log('this.biPeersList', this.biPeersList)
    //   this.peerList[data.from.userId].close()
    //   this.peerList[data.from.userId] = null
    //   let index = this.biPeersList.findIndex(v => v.other.userId === part.userId)
    //   if (index > -1) {
    //     this.biPeersList[index].close()
    //     this.biPeersList.splice(index, 1)
    //   }
    // })
  }

  changeTab = key => {
    console.log(key);
  }

  // creates local MediaStream.
  onStartLocalStream (callback) {
    navigator.mediaDevices.getUserMedia(this.state.mediaStreamConstraints).then((stream) => {
      this.getLocalStream(stream, callback)
    }).catch(this.handleLocalMediaStreamError)
  };

  // 本地流
  getLocalStream (stream, callback) {
    this.localVideo.srcObject = stream
    this.setState({
      localStream: stream
    })
    window.localStream = stream
    if (callback && typeof callback === 'function') {
      callback && callback()
    }
  };

  render() {
    const { messages, onlineClients } = this.state;
    return (
      <div className="App">
        <Layout>
          <Header className="header">WebRTC 聊天室</Header>
          <Content style={{ padding: '0 50px' }}>
            <UserJoinRoom joinRoom={this.onJoinRoom} startLocalStream={this.onStartLocalStream}/>
            <Conversation messages={ messages } onlineClients={ onlineClients }/>
            <div className="video-box">
              <Card title="本人" bordered={false} className="card">
                <video autoPlay playsInline ref={video => (this.localVideo = video)} controls id="localVideo"></video>
              </Card>
              <Card title="他人" bordered={false} style={{ marginTop: '20px' }}>
                <video autoPlay playsInline ref="remoteVideo" controls id="remoteVideo"></video>
              </Card>
            </div>
          </Content>
          <Footer>Footer</Footer>
      </Layout>
      </div>
    );
  }
}

export default App;
