import { Component } from "react";
import { SignalingServer } from './lib/signaling-server'
import "./App.css";
import { RTCPeer } from "./lib/peer";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      localMessages: "",
      remoteMessages: "",
      localOutMessage: "",
      remoteOutMessage: "",
    };
  }

  componentDidMount() {
    this.signalServer = new SignalingServer();
  }

  async componentWillUnmount() {
    if (this.state.connected) {
      this.disconnect();
    }
  }

  disconnect = () => {
    this._localPeer.close();
    this._remotePeer.close();
  }

  connect = async () => {
    console.log("connect!");
    try {
      // 1. setup connection
      const rtcPeerOptions = {
        signalServer: this.signalServer,
        onOpen: () => {
          this.setState({ connected: true });
        },
        onClosed: () => {
          this.setState({ connected: false });
        },
      };
      this._localPeer = new RTCPeer({
        ...rtcPeerOptions,
        name: 'local peer',
        onMessage: this._onLocalMessageReceived
      });
      this._remotePeer = new RTCPeer({
        ...rtcPeerOptions,
        name: 'remote peer',
        onMessage: this._onRemoteMessageReceived
      });

      // 2. setup channel
      this._localPeer.setupChannel();

      // 3. setup session
      await this._localPeer.createOffer();
      await this._remotePeer.createAnswer();
    } catch (err) {
      console.error(err);
    }
  }

  _onLocalMessageReceived = (event) => {
    console.log(`Remote message received by local: ${event.data}`);
    this.setState({
      localMessages: this.state.localMessages + "> " + event.data + "\n",
    });
  };

  _onRemoteMessageReceived = (event) => {
    console.log(`Local message received by remote: ${event.data}`);
    this.setState({
      remoteMessages: this.state.remoteMessages + "> " + event.data + "\n",
    });
  };

  _sendMessage = (value, channel) => {
    if (value === "") {
      console.log("Not sending empty message!");
      return;
    }
    console.log("Sending remote message: ", value);
    channel.send(value);
  };

  _handleChangeValue = (value, type) => {
    this.setState({
      [type]: value,
    });
  };

  render() {
    return (
      <section>
        <div className='controlPanel'>
          <button disabled={this.state.connected} onClick={this.connect}>
            Connect
          </button>
          <button disabled={!this.state.connected} onClick={this.disconnect}>
            Disconnect
          </button>
        </div>

        <div className='row'>
          <div className='column'>
            <h1>Local</h1>
            <div className='messageBox'>
              <label htmlFor='localOutgoing'>Local outgoing message:</label>
              <textarea
                className='message'
                id='localOutgoing'
                value={this.state.localOutMessage}
                onChange={(e) =>
                  this._handleChangeValue(e.target.value, "localOutMessage")
                }
              ></textarea>
              <button
                disabled={!this.state.connected}
                onClick={(e) =>
                  this._sendMessage(
                    this.state.localOutMessage,
                    this._localPeer.channel
                  )
                }
                id='sendLocal'
              >
                Send Message from Local
              </button>
            </div>
            <div className='messageBox'>
              <label htmlFor='localIncoming'>Local incoming messages:</label>
              <textarea
                className='message'
                id='localIncoming'
                disabled
                value={this.state.localMessages}
              ></textarea>
            </div>
          </div>

          <div className='column'>
            <h1>Remote</h1>
            <div className='messageBox'>
              <label htmlFor='remoteOutgoing'>Remote outgoing message:</label>
              <textarea
                className='message'
                id='remoteOutgoing'
                value={this.state.remoteOutMessage}
                onChange={(e) =>
                  this._handleChangeValue(e.target.value, "remoteOutMessage")
                }
              ></textarea>
              <button
                disabled={!this.state.connected}
                onClick={(e) =>
                  this._sendMessage(
                    this.state.remoteOutMessage,
                    this._remotePeer.channel
                  )
                }
                id='sendRemote'
              >
                Send Message from Remote
              </button>
            </div>
            <div className='messageBox'>
              <label htmlFor='remoteIncoming'>Remote incoming messages:</label>
              <textarea
                className='message'
                id='remoteIncoming'
                disabled
                value={this.state.remoteMessages}
              ></textarea>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default App;
