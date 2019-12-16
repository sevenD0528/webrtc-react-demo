import React from 'react';
import io from 'socket.io-client';

import UserJoinRoom from './components/UserJoinRoom';
import Conversation from './components/Conversation';
// import VideoChat from './components/VideoChat';

import { Card } from 'antd';
import { Layout } from 'antd';
import { Modal } from 'antd';

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
      user: {
        username: '',
        password: ''
      },
      isShowModal: false,
      modalText: '有人想要和你互动',
      modalData: {},
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
    this.setState({
      user
    })
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

    // 准备
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
    // pc message
    this.socket.on('pc message', (data) => {
      console.log('客户端收到了pc的消息', data);
      this.signalingMessageCallback(data);
    })

    // 收到别人发的聊天信息
    this.socket.on('message', data => {
      this.updateChatMessage(data)
    })

    // 收到别人的要求视频互动的私信
    this.socket.on('interact', data => {
      console.log(data);
      this.showModal(data);
    })

    // 对方同意了了和你视频互动，自己发起，对方接受
    this.socket.on('agree interact', data => {
      // this.$message({type: 'success', message: `${data.to.username}接受了视频互动的请求`})
      this.setState({
        pcMsgTo: data.to
      })
      this.trace(`${data.to.username}接受了视频互动的请求`);
      this.createPeerConnection(true, data);
    })
    
    // 对方拒绝了和你视频互动
    this.socket.on('refuse interact', data => {
      // this.$message({type: 'warning', message: `${data.to.username}拒绝了视频互动的请求`})
      this.trace(`${data.to.username}拒绝了视频互动的请求`);
    })

    // 监听到对方结束互动
    this.socket.on('stop interact', data => {
      let part = data.from;
      const { peerList, biPeersList } = this.state;
      const list = peerList;
      let biList = biPeersList;
      // this.$message({type: 'info', message: `${part.username}停止了和您互动，连接即将断开`, duration: 1500})
      console.log('this.biPeersList', this.biPeersList);
      list[data.from.userId] = null;
      this.state.peerList[data.from.userId].close();
      this.setState({
        peerList: list
      })
      let index = this.state.biPeersList.findIndex(v => v.other.userId === part.userId)
      if (index > -1) {
        this.state.biPeersList[index].close();
        biList = biList.splice(index, 1);
        this.setState({
          biPeersList: biList
        })
      }
    })
  }

  changeTab = key => {
    console.log(key);
  }

  // creates local MediaStream.
  onStartLocalStream = (callback) => {
    navigator.mediaDevices.getUserMedia(this.state.mediaStreamConstraints)
    .then((stream) => {
      this.handleLocalStream(stream, callback)
    })
    .catch(this.handleLocalMediaStreamError)
  };

  // 获取本地流
  handleLocalStream = (stream, callback) => {
    this.localVideo.srcObject = stream
    this.setState({
      localStream: stream
    })
    window.localStream = stream
    if (callback && typeof callback === 'function') {
      callback && callback()
    }
  };

  // 远程流
  handleRemoteMediaStreamAdded = (pc, event) => {
    pc.remoteStream = event.stream;
    let remoteVideo = this.remoteVideo;
    remoteVideo.srcObject = event.stream;
    remoteVideo.addEventListener('loadedmetadata', () => {
      remoteVideo.play();
    })
    console.log('biPeersList', this.state.biPeersList);
    this.setState({
      remoteStream: event.stream
    })
    this.trace('Received remote stream from ' + pc.other.username)
  }

  // remove remote stream
  handleRemoteStreamRemoved = (pc) => {
    this.trace('Remote stream  removed event', pc.other.username)
  }

  // local stream error
  handleLocalMediaStreamError = () => {
    console.log('本地视频采集出错')
  }

  // 发 pc message
  sendPcMessage = (PcMessage) => {
    let from = {userId: this.socket.id, username: this.state.user.username};
    let to = this.state.pcMsgTo;
    this.socket.emit('pc message', {from, to, pcMsg: PcMessage})
  }

  // 互动请求
  onStartInteract = (item) => {
    const { localStream, user } = this.state;
    // 开启互动之前,需要先开启视频采集
    if (!localStream) {
      this.onStartLocalStream(() => {
        this.socket.emit('interact', {from: {username: user.username, userId: this.socket.id}, to: item})
      })
    } else {
      this.socket.emit('interact', {from: {username: user.username, userId: this.socket.id}, to: item})
    }
  }

  // 互动请求对话框
  showModal = (data) => {
    const txt = `${data.from.username}想要和你互动`;
    this.setState({
      isShowModal: true,
      modalText: txt,
      modalData: data
    });
  };

  // 互动请求对话框 同意
  handleOk = (e) => {
    const { modalData } = this.state;
    this.setState({
      isShowModal: false,
    });
    // 同意和对方互动, 对方发起，自己接受
    this.socket.emit('agree interact', modalData);
    this.setState({
      pcMsgTo: modalData.from
    })
    this.createPeerConnection(false, modalData);
  };

  // 互动请求对话框 取消
  handleCancel = (e) => {
    const { modalData } = this.state;
    console.log(e);
    this.setState({
      isShowModal: false,
    });
    // 拒绝和对方互动
    this.socket.emit('refuse interact', modalData)
  };

  // 创建对等连接
  createPeerConnection = (isCreatedOffer, data) => {
    const { peerList } = this.state;
    const list = peerList;
    let other = isCreatedOffer ? data.to : data.from; // 对方
    if (!peerList[other.userId]) {
      let pc = new RTCPeerConnection(this.state.pcConfig);
      pc.from = data.from;
      pc.to = data.to;
      pc.isSelf = isCreatedOffer; // 是否是自己发起
      pc.other = isCreatedOffer ? data.to : data.from; // 对方
      list[other.userId] = pc;
      this.setState({
        peerList: list,
        biPeersList: [...this.state.biPeersList, pc]
      })
      console.log(pc);
      console.log(this.state.peerList, this.state.biPeersList);
      this.createConnect(isCreatedOffer, pc);
    }
  }

  // 创建连接
  createConnect  = (isCreatedOffer, pc) => {
    pc.addEventListener('icecandidate', event => {
      console.log('icecandidate event:', event)
      if (event.candidate) {
        this.sendPcMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        })
      } else {
        console.log('End of candidates.')
      }
    })
    if (this.state.localStream) {
      pc.addStream((this.state.localStream))
    } else {
      this.onStartLocalStream(this.addStreamToLocalPc(pc))
    }
    pc.addEventListener('addstream', (event) => {
      console.log('addstream')
      this.handleRemoteMediaStreamAdded(pc, event)
    })
    pc.addEventListener('removestream', (event) => {
      return this.handleRemoteStreamRemoved(pc, event)
    })
    // 创建offer,生成本地会话描述,如果是视频接收方，不需要生成offer
    if (isCreatedOffer) {
      pc.createOffer(this.state.offerOptions).then((description) => this.createdOfferSuccess(pc, description)).catch(this.logError)
    }
  }

  addStreamToLocalPc = (pc) => {
    return () => {
      pc.addStream((this.state.localStream))
    }
  }

  // 创建offer,生成本地会话描述
  createdOfferSuccess = (pc, description) => {
    // 用sd生成localPc的本地描述，remotePc的远程描述
    pc.setLocalDescription(description)
      .then(() => {
        this.sendPcMessage(pc.localDescription)
        this.setLocalDescriptionSuccess(description, 'offer')
        this.trace('local offer psd set.')
      }).catch(this.setSessionDescriptionError)
  }

  // 信令信息回调
  signalingMessageCallback = (message) => {
    let otherId = message.from.userId; // 对方的id
    let pc = this.state.peerList[otherId];
    message = message.pcMsg;
    if (message.type === 'offer') {
      console.log('signalingMessageCallback offer', message);
      pc.setRemoteDescription(new RTCSessionDescription(message)).then(() => {
        pc.createAnswer()
          .then((description) => this.createdAnswerSuccess(pc, description))
          .catch(this.setSessionDescriptionError)
      }).catch(this.logError)
    } else if (message.type === 'answer') {
      console.log('收到了answer');
      console.log('pc', pc);
      pc.setRemoteDescription(new RTCSessionDescription(message), function () {
      }, this.logError)
    } else if (message.type === 'candidate') {
      let candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      })
      pc.addIceCandidate(candidate).catch(err => {
        console.log('addIceCandidate-error', err)
      })
    }
  }

  createdAnswerSuccess = (pc, description) => {
    pc.setLocalDescription(description)
      .then(() => {
        this.sendPcMessage(pc.localDescription);
        this.setLocalDescriptionSuccess(description, 'answer');
        this.trace('local answer psd set.');
      })
      .catch(this.setSessionDescriptionError)
  }

  // 本地会话描述设置成功
  setLocalDescriptionSuccess = (desc, type = 'offer') => {
    console.log('local desc', desc);
    this.trace('setLocalDescription' + type + 'success', desc);
  }

  // 会话描述设置失败
  setSessionDescriptionError = (err) => {
    console.log('set session Description error');
    this.trace('set session Description error', err);
  }

  // log
  logError = (err) => {
    if (!err) return
    if (typeof err === 'string') {
      console.warn(err)
    } else {
      console.warn(err.toString(), err)
    }
  }

  // trace log
  trace = (text, data = '') => {
    text = text.trim()
    const now = (window.performance.now() / 1000).toFixed(3)
    console.log(now, text, data)
  }


  render() {
    const { user, messages, onlineClients, modalText } = this.state;
    return (
      <div className="App">
        <Layout>
          <Header className="header">WebRTC 聊天室</Header>
          <Content style={{ padding: '0 50px' }}>
            <UserJoinRoom 
              joinRoom={this.onJoinRoom} 
              startLocalStream={this.onStartLocalStream}
            />
            <Conversation 
              messages={ messages } 
              onlineClients={ onlineClients }
              user={user}
              updateChatMessage={this.updateChatMessage.bind(this)}
              socket={this.socket}
              onStartInteract={this.onStartInteract.bind(this)}
              />
            <div className="video-box">
              <Card title="本人" bordered={false} className="card">
                <video autoPlay playsInline ref={video => (this.localVideo = video)} controls id="localVideo"></video>
              </Card>
              <Card title="他人" bordered={false} style={{ marginTop: '20px' }}>
                <video autoPlay playsInline ref={video => (this.remoteVideo = video)} controls id="remoteVideo"></video>
              </Card>
            </div>
          </Content>
          <Modal
            title="互动请求"
            cancelText="拒绝"
            okText="接受"
            visible={this.state.isShowModal}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <p>{ modalText }</p>
          </Modal>
          <Footer>Footer</Footer>
        </Layout>
      </div>
    );
  }
}

export default App;
