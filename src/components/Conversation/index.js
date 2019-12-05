import React from 'react';
import { Tabs, Input, Button, List, Avatar } from 'antd';

import './style.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const data = [
  {
    title: 'Ant Design Title 1',
  },
  {
    title: 'Ant Design Title 2',
  },
  {
    title: 'Ant Design Title 3',
  },
  {
    title: 'Ant Design Title 4',
  },
];

class Converstaion extends React.Component {
  constructor(props) {
    super(props);
    this.changeTab = this.changeTab.bind(this);
  }

  changeTab = key => {
    console.log(key);
  }

  render() {
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
                    title={<a href="https://ant.design">{item.msg}</a>}
                  />
                </List.Item>
              )}
            />  
          </div>
          <TextArea rows={3}/>
          <Button type="primary" className="send-btn">发送</Button>
        </TabPane>
        <TabPane tab="用户列表" key="2" className="tab-pane">
          <List
            itemLayout="horizontal"
            dataSource={onlineClients}
            renderItem={item => (
              <List.Item>
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