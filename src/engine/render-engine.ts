import { GLRenderer } from "../webgl/gl-renderer";
import { RenderList } from "./render-list";
import { RenderObject, RenderRange } from "../core/render-object";
import { Camera } from "../core/camera";
import { Matrix4 } from "../math/matrix4";
import { GLProgram } from "../webgl/program";
import { Geometry } from "../core/geometry";
import { BufferData, Uint32BufferData } from "../core/buffer-data";
import { Technique } from "../core/technique";
import { DrawMode } from "../webgl/const";
import { Texture } from "../core/texture";
import { Material } from "../core/material";
import { GLTextureUniform } from "../webgl/uniform/uniform-texture";
import { PerspectiveCamera } from "../camera/perspective-camera";
import { Nullable } from "../type";
import { InnerSupportUniform, InnerUniformMap } from "../webgl/uniform/uniform";
import { UniformProxy } from "./uniform-proxy";
import { Observable } from "../core/observable";
import { GLFramebuffer } from '../webgl/gl-framebuffer';
import { QuadSource } from '../render-graph/quad-source';
import { CopyTechnique } from '../technique/technique-lib/copy-technique';

export interface RenderSource{
  getRenderList(): RenderList;
}

export interface Size{
  width: number;
  height: number;
}


const copyTechnique = new CopyTechnique();
const quad = new QuadSource();

export class ARTEngine {
  constructor(el?: HTMLCanvasElement, options?: any) {
    this.renderer = new GLRenderer(el, options);
    // if we have a element param, use it as the default camera's param for convienience
    if (el !== undefined) {
      (this.camera as PerspectiveCamera).aspect = el.width / el.height;
    }

    InnerUniformMap.forEach((des, key) => {
      this.globalUniforms.set(key, new UniformProxy(des.default))
    })
  }

  readonly renderer: GLRenderer;

  // resize
  readonly resizeObservable: Observable<Size> = new Observable<Size>();
  setSize(width:number, height: number) {
    if (this.renderer.setSize(width, height)) {
      this.resizeObservable.notifyObservers({
        width, height
      })
    }
  }
  setActualSize(width: number, height: number) {
    if (this.renderer.setRawRenderSize(width, height)) {
      this.resizeObservable.notifyObservers({
        width, height
      })
    }
  }


  overrideTechnique: Nullable<Technique> = null;

  ////




  //// camera related
  _camera: Camera = new PerspectiveCamera();
  public isCameraChanged = true;
  get camera() { return this._camera };
  set camera(camera) {
    this._camera = camera;
    this.isCameraChanged = true;
  };
  private cameraMatrixRerverse = new Matrix4();
  private ProjectionMatirx = new Matrix4();
  private VPMatrix = new Matrix4();
  private LastVPMatrix = new Matrix4();

  private jitterPMatrix = new Matrix4();
  private jitterVPMatrix = new Matrix4();

  jitterProjectionMatrix() {
    this.jitterPMatrix.copy(this.ProjectionMatirx);
    this.jitterPMatrix.elements[8] += ((2 * Math.random() - 1) / this.renderer.width);
    this.jitterPMatrix.elements[9] += ((2 * Math.random() - 1) / this.renderer.height);
    this.jitterVPMatrix.multiplyMatrices(this.jitterPMatrix, this.cameraMatrixRerverse);
    this.globalUniforms.get(InnerSupportUniform.VPMatrix).setValue(this.jitterVPMatrix);
  }

  unjit() {
    this.globalUniforms.get(InnerSupportUniform.VPMatrix).setValue(this.VPMatrix);
  }

  /**
   * call this to update enginelayer camera related render info
   * such as matrix global uniform.
   *
   * @memberof ARTEngine
   */
  connectCamera() {
    let needUpdateVP = false;
    // 
    if (this.camera.projectionMatrixNeedUpdate) {
      this.camera.updateProjectionMatrix();
      this.ProjectionMatirx.copy(this.camera.projectionMatrix);
      needUpdateVP = true;
    }
    if (this.camera.transform.transformFrameChanged) {
      this.camera.transform.matrix;
      this.camera.updateWorldMatrix(true);
      this.cameraMatrixRerverse.getInverse(this.camera.worldMatrix, true);
      needUpdateVP = true;
    }

    this.LastVPMatrix.copy(this.VPMatrix);
    this.globalUniforms.get(InnerSupportUniform.LastVPMatrix).setValue(this.LastVPMatrix);

    if (needUpdateVP) {
      this.VPMatrix.multiplyMatrices(this.ProjectionMatirx, this.cameraMatrixRerverse);
      this.globalUniforms.get(InnerSupportUniform.VPMatrix).setValue(this.VPMatrix);
      needUpdateVP = false;
      this.isCameraChanged = true;
    } else {
      this.isCameraChanged = false;
    }
   
  }
  ////




  //// render APIs
  // render renderList from given source
  render(source: RenderSource) {
    const renderlist = source.getRenderList();
    renderlist.forEach((obj) => {
      this.renderObject(obj);
    })
  }

  renderObjects(objects: RenderObject[]) {
    for (let i = 0; i < objects.length; i++) {
      this.renderObject(objects[i]);
    }
  }

  renderObject(object: RenderObject) {

    // prepare technique
    const program = this.connectTechnique(object);

    // prepare material
    this.connectMaterial(object.material, program);

    // prepare geometry
    this.connectGeometry(object.geometry, program);

    this.connectRange(object.range, program, object.geometry)

    // render
    this.renderer.render(DrawMode.TRIANGLES, program.useIndexDraw);
  }

  renderDebugFrameBuffer(framebuffer: GLFramebuffer) {
    this.renderer.setRenderTargetScreen();
    const debugViewPort = framebuffer.debuggingViewport;
    this.renderer.state.setViewport(
      debugViewPort.x, debugViewPort.y,
      debugViewPort.z, debugViewPort.w
    );

    this.overrideTechnique = copyTechnique;
    this.overrideTechnique.getProgram(this).defineFrameBufferTextureDep(
      framebuffer.name, 'copySource'
    );
    this.render(quad);
    this.overrideTechnique = null;
  }
  ////




  //// low level resouce binding
  globalUniforms: Map<InnerSupportUniform, UniformProxy> = new Map();
  connectTechnique(object: RenderObject): GLProgram {
    let technique: Technique;
    if (this.overrideTechnique !== null) {
      technique = this.overrideTechnique;
    } else {
      technique = object.technique;
    }
    const program = technique.getProgram(this);
    this.renderer.useProgram(program);
    this.globalUniforms.get(InnerSupportUniform.MMatrix).setValue(object.worldMatrix);
    program.updateInnerGlobalUniforms(this); // TODO maybe minor optimize here
    technique.uniforms.forEach((uni, key) => {
      // if (uni._needUpdate) {
        program.setUniform(key, uni.value);
        uni.resetUpdate();
      // }
    })
    return program;
  }

  connectMaterial(material: Material, program: GLProgram) {

    program.forTextures((tex: GLTextureUniform) => {
      let webgltexture: WebGLTexture;

      // aquire texuture from material or framebuffers
      if (material !== undefined) {
        if (tex.channel === undefined) {
          throw 'use texture in material / use material to render should set textureuniform channel type'
        }
        const texture = material.getChannelTexture(tex.channel);
        if (texture.gltextureId === undefined) {
          texture.gltextureId = this.renderer.textureManger.createTextureFromImageElement(texture.image);
          webgltexture = this.renderer.textureManger.getGLTexture(texture.gltextureId);
        }
      } 

      if (webgltexture === undefined) {
        const frambufferName = program.framebufferTextureMap[tex.name];
        if (frambufferName === undefined) {
          throw  `cant find frambuffer for tex ${tex.name}, please define before use`
        }
        webgltexture = this.renderer.frambufferManager.getFramebufferTexture(frambufferName);
      }

      if (webgltexture === undefined) {
        throw 'texture bind failed'
      }
      
      tex.useTexture(webgltexture);
    })
  }

  connectGeometry(geometry: Geometry, program: GLProgram) {

    program.forAttributes(att => {
      const bufferData = geometry.bufferDatas[att.name];
      let glBuffer = this.getGLAttributeBuffer(bufferData);
      if (glBuffer === undefined) {
        glBuffer = this.createOrUpdateAttributeBuffer(bufferData, false);
      }
      att.useBuffer(glBuffer);
    })

    if (program.useIndexDraw) {
      if (geometry.indexBuffer === null) {
        throw 'indexBuffer not found for index draw'
      }
      const geometryIndexBuffer = geometry.indexBuffer;
      if (geometryIndexBuffer instanceof Uint32BufferData) {
        program.indexUINT = true;
      } else {
        program.indexUINT = false;
      }
      let glBuffer = this.getGLAttributeBuffer(geometryIndexBuffer);
      if (glBuffer === undefined) {
        glBuffer = this.createOrUpdateAttributeBuffer(geometryIndexBuffer, true);
      }
      program.useIndexBuffer(glBuffer);
    }
  }

  connectRange(range: RenderRange, program: GLProgram, geometry: Geometry) {
    let start = 0;
    let count = 0;
    if (range === undefined) {
      if (geometry.indexBuffer !== null) {
        count = geometry.indexBuffer.data.length;
      } else {
        throw 'range should be set if use none index geometry'
      }
    }
    program.drawFrom = start;
    program.drawCount = count;
  }



  //  GL resouce aqusition
  getGLTexture(texture: Texture): WebGLTexture {
    const id = texture.gltextureId;
    return this.renderer.getGLTexture(id);
  }
  private programTechniqueMap: Map<Technique, GLProgram> = new Map();
  getProgram(technique: Technique): GLProgram {
    return this.programTechniqueMap.get(technique);
  }

  createProgram(technique: Technique): GLProgram  {
    const program = this.renderer.createProgram(technique.config.programConfig);
    this.programTechniqueMap.set(technique, program);
    return program;
  }

  getGLAttributeBuffer(bufferData: BufferData): WebGLBuffer {
    return this.renderer.attributeBufferManager.getGLBuffer(bufferData.data.buffer as ArrayBuffer);
  }

  createOrUpdateAttributeBuffer(bufferData: BufferData, useforIndex: boolean): WebGLBuffer {
    return this.renderer.attributeBufferManager.updateOrCreateBuffer(bufferData.data.buffer as ArrayBuffer, useforIndex);
  }


  dispose() {
    this.resizeObservable.clear();
    this.renderer.dispose();
  }


}