import React from 'react';
import { Card } from 'antd';
import { getDisplayStream } from "../../utils/media-access";
import './style.css';

class VideoChat extends React.Component {
  constructor() {
    super();
    this.state = {
      localStream: {},
      remoteStreamUrl: '',
      streamUrl: '',
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true
    }
  }

  componentDidMount() {
  }
  

  changeTab = key => {
    console.log(key);
  }

  getUserMedia(cb) {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia
      const op = {
        video: {
          width: { min: 160, ideal: 640, max: 1280 },
          height: { min: 120, ideal: 360, max: 720 }
        },
        audio: true
      }
      navigator.getUserMedia(
        op,
        stream => {
          this.setState({ streamUrl: stream, localStream: stream })
          this.localVideo.srcObject = stream
          resolve()
        },
        () => {}
      )
    })
  }

  getDisplay(){
    getDisplayStream().then(stream => {
      stream.oninactive = () => {
        this.state.peer.removeStream(this.state.localStream)  
        this.getUserMedia().then(() => {
          this.state.peer.addStream(this.state.localStream)  
        })
      }
      this.setState({ streamUrl: stream, localStream: stream })
      this.localVideo.srcObject = stream   
      this.state.peer.addStream(stream)   
    })
  }

  render() {
    return (
      <div className="video-box">
        <Card title="本人" bordered={false} className="card">
          <video autoPlay playsInline ref={video => (this.localVideo = video)} controls id="localVideo"></video>
        </Card>
        <Card title="他人" bordered={false} style={{ marginTop: '20px' }}>
          <video autoPlay playsInline ref="remoteVideo" controls id="remote-video"></video>
        </Card>
      </div>
    )
  }
}

export default VideoChat;