import React from 'react';
import { Tabs, Input, Button, List, Avatar } from 'antd';

import './style.css';

const { TabPane } = Tabs;
const { TextArea } = Input;

class Converstaion extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sendingMsg: ''
    }
    this.changeTab = this.changeTab.bind(this);
  }

  changeTab = key => {
    console.log(key);
  }

  handleGetInputValue = (event) => {
    this.setState({
      sendingMsg : event.target.value,
    })
  }

  // 发送消息
  handleSendMesssage = () => {
    const { sendingMsg } = this.state;
    this.setState({
      sendingMsg 
    })
    let data = {msg: sendingMsg, username: this.props.user.username}
    this.props.socket.emit('message', data)
    this.props.updateChatMessage(data)
    this.setState({
      sendingMsg: ''
    })
  }

  handleVideoChat = (item) => {
    const { user } = this.props;

    if (user.username === item.username) {
      alert('不能和自己通话');  
      return;
    }
    
    this.props.onStartInteract(item);
  }

  render() {
    const { sendingMsg } = this.state;
    const { messages, onlineClients } = this.props;
    return (
      <Tabs defaultActiveKey="1" onChange={this.changeTab} className="tabs">
        <TabPane tab="聊天" key="1" className="tab-pane">
          <div className="chat-room">
            <List
              itemLayout="horizontal"
              dataSource={messages}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                    title={<a href="https://ant.design">{item.username ? `${item.username}说： ` : ''}{item.msg}</a>}
                  />
                </List.Item>
              )}
            />  
          </div>
          <TextArea 
            rows={3}
            value={sendingMsg}
            onChange={this.handleGetInputValue}
            />
          <Button type="primary" className="send-btn" onClick={this.handleSendMesssage.bind(this)}>发送</Button>
        </TabPane>
        <TabPane tab="用户列表" key="2" className="tab-pane">
          <List
            itemLayout="horizontal"
            dataSource={onlineClients}
            renderItem={item => (
              <List.Item
                actions={[<a key="list-loadmore-edit" onClick={this.handleVideoChat.bind(this, item)}>视频通话</a>]}
              >
                <List.Item.Meta
                  avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                  title={<a href="https://ant.design">{item.username}</a>}
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    )
  }
}

export default Converstaion;