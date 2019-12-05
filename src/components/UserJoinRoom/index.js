import { Form, Icon, Input, Button } from 'antd';
import React from 'react';
import './index.css';

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class UserJoinRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    }
    this.handleJoinRoom = this.handleJoinRoom.bind(this);
  }

  componentDidMount() {
    // To disabled submit button at the beginning.
    this.props.form.validateFields();
  }

  handleJoinRoom = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
      }
      this.props.joinRoom(values);
    });
  };

  handleStartLocalStream = e => {
    e.preventDefault();
    this.props.startLocalStream();
  }

  render() {
    const { getFieldDecorator, getFieldsError, getFieldError, isFieldTouched } = this.props.form;

    // Only show error after a field is touched.
    const usernameError = isFieldTouched('username') && getFieldError('username');
    const passwordError = isFieldTouched('password') && getFieldError('password');
    return (
      <Form layout="inline" className="room-input">
        <Form.Item validateStatus={usernameError ? 'error' : ''} help={usernameError || ''}>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: 'Please input your username!' }],
          })(
            <Input
              prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Username"
            />,
          )}
        </Form.Item>
        <Form.Item validateStatus={passwordError ? 'error' : ''} help={passwordError || ''}>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: 'Please input your Password!' }],
          })(
            <Input
              prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
              type="password"
              placeholder="Password"
            />,
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={hasErrors(getFieldsError())} onClick={this.handleJoinRoom}>
            加入聊天室
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={this.handleJoinRoom}>
            离开聊天室
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={this.handleStartLocalStream}>
            采集本地视频
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

const UserForm = Form.create({ name: 'joinroom' })(UserJoinRoom);

export default UserForm;
// ReactDOM.render(<WrappedUserJoinRoom />, mountNode);