import { Component } from "react";
import "./App.css";

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

  async componentWillUnmount() {
    if (this.state.connected) {
      this.disconnect();
    }
  }

  disconnect = () => {
    this._localConnection.close();
    this._remoteConnection.close();
  };

  connect = async () => {
    console.log("connect!");
    try {
      const dataChannelParams = {
        // For UDP semantics, set maxRetransmits to 0 and ordered to false.
        ordered: false,
        maxRetransmits: 0,
      };
      // 1. setup connection
      this._localConnection = new RTCPeerConnection();
      this._localConnection.addEventListener("icecandidate", async (e) => {
        console.log("local connection ICE candidate: ", e.candidate);
        await this._remoteConnection.addIceCandidate(e.candidate);
      });

      this._remoteConnection = new RTCPeerConnection();
      this._remoteConnection.addEventListener("icecandidate", async (e) => {
        console.log("remote connection ICE candidate: ", e.candidate);
        await this._localConnection.addIceCandidate(e.candidate);
      });

      // 2. setup channel
      this._localChannel = this._localConnection.createDataChannel(
        "messaging-channel",
        dataChannelParams
      );
      this._localChannel.binaryType = "arraybuffer";
      this._localChannel.addEventListener("open", () => {
        console.log("Local channel open!");
        this.setState({ connected: true });
      });
      this._localChannel.addEventListener("close", () => {
        console.log("Local channel closed!");
        this.setState({ connected: false });
      });
      this._localChannel.addEventListener(
        "message",
        this._onLocalMessageReceived
      );

      this._remoteConnection.addEventListener(
        "datachannel",
        this._onRemoteDataChannel
      );

      // 3. setup local offer
      const initLocalOffer = async () => {
        const localOffer = await this._localConnection.createOffer();
        console.log(`Got local offer ${JSON.stringify(localOffer)}`);
        const localDesc = this._localConnection.setLocalDescription(localOffer);
        const remoteDesc =
          this._remoteConnection.setRemoteDescription(localOffer);
        return Promise.all([localDesc, remoteDesc]);
      };
      await initLocalOffer();

      // 4. setup remote answer
      const initRemoteAnswer = async () => {
        const remoteAnswer = await this._remoteConnection.createAnswer();
        console.log(`Got remote answer ${JSON.stringify(remoteAnswer)}`);
        const localDesc =
          this._remoteConnection.setLocalDescription(remoteAnswer);
        const remoteDesc =
          this._localConnection.setRemoteDescription(remoteAnswer);
        return Promise.all([localDesc, remoteDesc]);
      };
      await initRemoteAnswer();
    } catch (err) {
      console.error(err);
    }
  };

  _onLocalMessageReceived = (event) => {
    console.log(`Remote message received by local: ${event.data}`);
    this.setState({
      localMessages: this.state.localMessages + "> " + event.data + "\n",
    });
  };

  _onRemoteDataChannel = (event) => {
    console.log(`onRemoteDataChannel: ${JSON.stringify(event)}`);
    this._remoteChannel = event.channel;
    this._remoteChannel.binaryType = "arraybuffer";
    this._remoteChannel.addEventListener(
      "message",
      this._onRemoteMessageReceived.bind(this)
    );
    this._remoteChannel.addEventListener("close", () => {
      console.log("Remote channel closed!");
      this.setState({ connected: false });
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
                    this._localChannel
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
                    this._remoteChannel
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
