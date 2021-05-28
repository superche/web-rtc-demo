function genPeerId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * I'm a dummy WebRTC signaling server
 */
export class SignalingServer {
    /**
     *  Array<{
            peerId: string;
            peer: RTCPeer;
        }>
     */
    peerList = [];

    registryRTCPeer(peer) {
        const peerId = genPeerId();
        this.peerList.push({
            peerId,
            peer,
        });
        return peerId;
    }

    unregistryRTCPeer(peerId) {
        const index = this.peerList.findIndex(item => item.peerId === peerId);
        if (index >= 0) {
            this.peerList.splice(index, 1);
            return true;
        }
        return false;
    }

    sendOffer(peerId, offer) {
        this.peerList.forEach(item => {
            if (item.peerId === peerId) {
                return;
            }
            item.peer.receiveOffer(offer);
        });
    }

    sendAnswer(peerId, answer) {
        this.peerList.forEach(item => {
            if (item.peerId === peerId) {
                return;
            }
            item.peer.receiveAnswer(answer);
        });
    }

    sendIceCandidate(peerId, candidate) {
        this.peerList.forEach(item => {
            if (item.peerId === peerId) {
                return;
            }
            item.peer.addIceCandidate(candidate);
        });
    }
}