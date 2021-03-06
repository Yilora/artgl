import { ARTEngine } from "../engine/render-engine";

export type BufferDataType = Float32Array | Uint16Array | Uint32Array;

/**
 * bufferdata is webglbuffer container
 * 
 * @export
 * @class BufferData
 */
export class BufferData{
  constructor(data: BufferDataType) {
    this.data = data;
  }
  data: BufferDataType;
  shouldUpdate = true;

  setIndex(index: number, value: number) {
    this.shouldUpdate = true;
    this.data[index] = value;
  }
  setData(data: BufferDataType) {
    this.shouldUpdate = true;
    this.data = data;
  }

  getGLAttribute(engine: ARTEngine): WebGLBuffer {
    return engine.getGLAttributeBuffer(this);
  }

  getDataSizeByte() {
    return this.data.byteLength;
  }
}

export class Float32BufferData extends BufferData{
  constructor(data: Float32Array) {
    super(data);
  }

}

export class Uint16BufferData extends BufferData {
  constructor(data: Uint16Array) {
    super(data);
  }
}

export class Uint32BufferData extends BufferData {
  constructor(data: Uint32Array) {
    super(data);
  }
}