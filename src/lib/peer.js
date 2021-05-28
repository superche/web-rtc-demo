import { dataChannelName, dataChannelParams } from './constants';

/**
 *  options: {
        name: string;
        signalServer: SignalingServer,
        onOpen: Function;
        onClosed: Function;
        onMessage: (ev: MessageEvent<any>) => any;
    };
    name: string;
    peerId?: string;

    connection: RTCPeerConnection;
    channel?: RTCDataChannel;
 */
export class RTCPeer {
    constructor(options) {
        this.name = options.name;
        this.options = options;
        
        // 1. setup connection
        this.connection = new RTCPeerConnection();
        this.setupConnection();
    }

    //////////
    // Connection
    //////////
    setupConnection = async () => {
        this.peerId = this.options.signalServer.registryRTCPeer(this);

        this.connection.addEventListener('icecandidate', async (e) => {
            this.log('ICE candidate:', e.candidate);
            this.options.signalServer.sendIceCandidate(this.peerId, e.candidate);
        });
        this.connection.addEventListener('datachannel', this.onDataChannel);
    }

    addIceCandidate = (candidate) => {
        return this.connection.addIceCandidate(candidate);
    }

    close = () => {
        this.options.signalServer.unregistryRTCPeer(this.peerId);
        this.connection.close();
    }


    //////////
    // Channel
    //////////
    setupChannel = () => {
        // 2. setup channel
        this.channel = this.connection.createDataChannel(dataChannelName, dataChannelParams);
        this.onDataChannel({
            channel: this.channel
        });
    }

    onDataChannel = (event) => {
        this.channel = event.channel;
        this.channel.binaryType = 'arraybuffer';
        this.channel.addEventListener('open', () => {
            this.log('channel open!');
            this.options.onOpen();
        });
        this.channel.addEventListener('close', () => {
            this.log('channel closed!');
            this.options.onClosed();
        });
        this.channel.addEventListener(
            'message',
            this.options.onMessage,
        );
    }

    
    //////////
    // Session
    //////////
    createOffer = async () => {
        // 3. setup local offer
        const offer = await this.connection.createOffer();
        this.log('Got offer', JSON.stringify(offer));
        const promise = this.connection.setLocalDescription(offer);
        this.options.signalServer.sendOffer(this.peerId, offer);
        
        return promise;
    }

    receiveOffer = async (offer) => {
        return this.connection.setRemoteDescription(offer);
    }

    createAnswer = async () => {
        // 4. setup remote answer
        const answer = await this.connection.createAnswer();
        this.log('Got answer', JSON.stringify(answer));
        const promise = this.connection.setLocalDescription(answer);
        this.options.signalServer.sendAnswer(this.peerId, answer);

        return promise;
    }

    receiveAnswer = async (answer) => {
        return this.connection.setRemoteDescription(answer);
    }

    log(...message) {
        console.log(`[${this.name}]`, ...message);
    }
}