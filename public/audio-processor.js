class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._bytesWritten = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this._buffer[this._bytesWritten++] = channelData[i];
        if (this._bytesWritten >= this._bufferSize) {
          const pcmData = this.float32ToPcm(this._buffer);
          this.port.postMessage({ type: 'audio', data: this.toBase64(pcmData) });
          this._bytesWritten = 0;
        }
      }
    }
    return true;
  }

  float32ToPcm(float32Array) {
    const pcm = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm.buffer;
  }

  toBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

registerProcessor('audio-processor', AudioProcessor);
